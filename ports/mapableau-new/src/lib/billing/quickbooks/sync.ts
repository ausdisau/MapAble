/**
 * QuickBooks Online invoice push/pull sync for mapableau-new.
 *
 * Ported from REPL server/quickbooks.ts (invoice-sync portion).
 * Uses the QB API client from ./client and Prisma types injected by the caller.
 *
 * Key differences from REPL:
 * - `storage` replaced with caller-injected `prisma` instance
 * - QB user fields expected on mapableau-new User model (see prisma/additions.prisma)
 * - Australian GST/TaxCodeRef mapping preserved
 */

import { getValidQbAccessToken, qbApiRequest, type QbUser, type QbTokenPrisma } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapAbleLineItem {
  type: string;
  ndisItemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  subtotal: number;
  date: string;
}

export interface InvoiceForQb {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: string | number;
  totalIncGst?: string | number | null;
  gstAmount?: string | number | null;
  lineItems: MapAbleLineItem[] | null;
  qbInvoiceId?: string | null;
  qbSyncStatus?: string | null;
  status?: string;
}

export interface QbSyncPrisma extends QbTokenPrisma {
  invoice: {
    update: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
  user: {
    update: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function findOrCreateQbItem(
  accessToken: string,
  realmId: string,
  itemName: string,
): Promise<{ value: string; name: string }> {
  const safeName = itemName.replace(/'/g, "\\'").substring(0, 100);
  try {
    const queryRes = await qbApiRequest(
      accessToken,
      realmId,
      "GET",
      `query?query=${encodeURIComponent(`SELECT * FROM Item WHERE Name = '${safeName}'`)}`,
    );
    const itemList = (queryRes?.QueryResponse as any)?.Item as Array<{
      Id: string;
      Name: string;
    }> | undefined;
    if (itemList && itemList.length > 0) {
      return { value: itemList[0].Id, name: itemList[0].Name };
    }
  } catch {
    // fallthrough to create
  }
  try {
    const newItem = await qbApiRequest(accessToken, realmId, "POST", "item", {
      Name: safeName,
      Type: "Service",
      IncomeAccountRef: { value: "1", name: "Services" },
    });
    const created = (newItem as any).Item as { Id: string; Name: string } | undefined;
    if (created) return { value: created.Id, name: created.Name };
  } catch {
    // fallthrough to default
  }
  return { value: "1", name: "Services" };
}

function mapInvoiceToQbPayload(
  invoice: InvoiceForQb,
  participantName: string,
  participantEmail: string | null,
  participantNdisNumber: string | null,
  itemRef: { value: string; name: string },
  customerRef?: { value: string; name: string },
) {
  const lineItems = invoice.lineItems || [];
  const gstAmount = Number(invoice.gstAmount || 0);
  const hasGst = gstAmount > 0;

  const qbLines = lineItems.map((item) => ({
    Amount: item.subtotal || 0,
    DetailType: "SalesItemLineDetail" as const,
    Description: `${item.ndisItemCode || ""} - ${item.description || ""}`.trim(),
    SalesItemLineDetail: {
      ItemRef: itemRef,
      Qty: item.quantity || 1,
      UnitPrice: item.unitRate || 0,
      TaxCodeRef: { value: hasGst ? "TAX" : "NON" },
    },
  }));

  return {
    Line: qbLines,
    ...(customerRef ? { CustomerRef: customerRef } : {}),
    TxnDate: invoice.periodStart,
    DueDate: invoice.periodEnd,
    DocNumber: `MAP-${invoice.id.substring(0, 8).toUpperCase()}`,
    PrivateNote: `MapAble Invoice ${invoice.id} for ${participantName} (NDIS: ${participantNdisNumber || "N/A"})`,
    CurrencyRef: { value: "AUD" },
    GlobalTaxCalculation: hasGst ? "TaxInclusive" : "NotApplicable",
    ...(hasGst ? { TxnTaxDetail: { TotalTax: gstAmount } } : {}),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function pushInvoiceToQb(
  prisma: QbSyncPrisma,
  userId: string,
  invoiceId: string,
  getUser: (id: string) => Promise<(QbUser & { fullName: string; email: string | null; ndisNumber: string | null }) | null>,
  getInvoice: (id: string) => Promise<InvoiceForQb | null>,
): Promise<void> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error("Invoice not found");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { qbSyncStatus: "syncing", qbSyncError: null },
  });

  try {
    const { accessToken, realmId } = await getValidQbAccessToken(prisma, user);

    // Find or create QB customer
    let customerRef: { value: string; name: string } | undefined;
    try {
      const queryRes = await qbApiRequest(
        accessToken,
        realmId,
        "GET",
        `query?query=${encodeURIComponent(
          `SELECT * FROM Customer WHERE DisplayName = '${user.fullName.replace(/'/g, "\\'")}'`,
        )}`,
      );
      const customers = queryRes?.QueryResponse?.Customer;
      if (customers && customers.length > 0) {
        customerRef = { value: customers[0].Id, name: customers[0].DisplayName };
      } else {
        const newCustomer = await qbApiRequest(
          accessToken,
          realmId,
          "POST",
          "customer",
          {
            DisplayName: user.fullName,
            PrimaryEmailAddr: user.email ? { Address: user.email } : undefined,
            Notes: `NDIS Number: ${user.ndisNumber || "N/A"}`,
          },
        );
        if (newCustomer.Customer) {
          customerRef = {
            value: newCustomer.Customer.Id,
            name: newCustomer.Customer.DisplayName,
          };
        }
      }
    } catch (err) {
      console.error("[qb-sync] Customer lookup/create failed:", err);
    }

    const itemRef = await findOrCreateQbItem(accessToken, realmId, "NDIS Support Services");
    const payload = mapInvoiceToQbPayload(
      invoice,
      user.fullName,
      user.email,
      user.ndisNumber,
      itemRef,
      customerRef,
    );

    let result: any;
    if (invoice.qbInvoiceId) {
      const existing = await qbApiRequest(
        accessToken,
        realmId,
        "GET",
        `invoice/${invoice.qbInvoiceId}`,
      );
      result = await qbApiRequest(accessToken, realmId, "POST", "invoice", {
        ...payload,
        Id: invoice.qbInvoiceId,
        SyncToken: existing.Invoice?.SyncToken,
      });
    } else {
      result = await qbApiRequest(accessToken, realmId, "POST", "invoice", payload);
    }

    const qbInvoice = result?.Invoice;
    if (!qbInvoice) throw new Error("QuickBooks did not return an Invoice object");

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        qbInvoiceId: qbInvoice.Id,
        qbSyncStatus: "synced",
        qbSyncError: null,
        qbLastSyncedAt: new Date(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[qb-sync] Invoice push failed:", msg);
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { qbSyncStatus: "error", qbSyncError: msg },
    });
    throw err;
  }
}

export async function pullPaymentsFromQb(
  prisma: QbSyncPrisma,
  userId: string,
  getUser: (id: string) => Promise<(QbUser & { fullName: string; email: string | null; ndisNumber: string | null }) | null>,
  getPendingInvoices: (userId: string) => Promise<InvoiceForQb[]>,
): Promise<{ updated: number; errors: string[] }> {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  const { accessToken, realmId } = await getValidQbAccessToken(prisma, user);
  const invoices = (await getPendingInvoices(userId)).filter(
    (inv) => inv.qbInvoiceId && inv.status !== "paid",
  );

  let updated = 0;
  const errors: string[] = [];

  for (const invoice of invoices) {
    try {
      const paymentsRes = await qbApiRequest(
        accessToken,
        realmId,
        "GET",
        `query?query=${encodeURIComponent(
          `SELECT * FROM Payment WHERE Line.LinkedTxn.TxnId = '${invoice.qbInvoiceId}'`,
        )}`,
      );
      const payments = paymentsRes?.QueryResponse?.Payment;
      if (payments && payments.length > 0) {
        const totalPaid = payments.reduce(
          (sum: number, p: { TotalAmt: number }) => sum + Number(p.TotalAmt || 0),
          0,
        );
        const invoiceTotal = Number(invoice.totalIncGst || invoice.totalAmount);
        if (totalPaid >= invoiceTotal) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "paid",
              qbSyncStatus: "synced",
              qbLastSyncedAt: new Date(),
            },
          });
          updated++;
        }
      }
    } catch (err) {
      const msg = `Failed to check payments for invoice ${invoice.id}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { updated, errors };
}

export async function handleQbWebhook(
  prisma: QbSyncPrisma,
  payload: {
    eventNotifications?: Array<{
      realmId: string;
      dataChangeEvent?: {
        entities?: Array<{ name: string; id: string; operation: string }>;
      };
    }>;
  },
  getUser: (id: string) => Promise<(QbUser & { fullName: string; email: string | null; ndisNumber: string | null }) | null>,
  getPendingInvoices: (userId: string) => Promise<InvoiceForQb[]>,
  getUsersByRealmId: (realmId: string) => Promise<{ id: string }[]>,
): Promise<void> {
  if (!payload.eventNotifications) return;
  for (const notification of payload.eventNotifications) {
    const paymentEvents = (notification.dataChangeEvent?.entities || []).filter(
      (e) => e.name === "Payment",
    );
    if (!paymentEvents.length) continue;
    const users = await getUsersByRealmId(notification.realmId);
    for (const user of users) {
      try {
        await pullPaymentsFromQb(prisma, user.id, getUser, getPendingInvoices);
      } catch (err) {
        console.error(`[qb-webhook] Failed to pull payments for user ${user.id}:`, err);
      }
    }
  }
}
