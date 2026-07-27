import { storage } from "./storage";
import type { Invoice, User } from "@shared/schema";

const QB_CLIENT_ID = process.env.QB_CLIENT_ID || "";
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET || "";
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI || "";
const QB_ENVIRONMENT = process.env.QB_ENVIRONMENT || "sandbox";
const QB_BASE_URL = QB_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com";
const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export function qbEnabled(): boolean {
  return !!(QB_CLIENT_ID && QB_CLIENT_SECRET && QB_REDIRECT_URI);
}

export function getQbAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: QB_CLIENT_ID,
    redirect_uri: QB_REDIRECT_URI,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state,
  });
  return `${QB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeQbCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
}> {
  const credentials = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
      "Accept": "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: QB_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`QuickBooks token exchange failed: ${error}`);
  }

  return res.json();
}

export async function refreshQbToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
      "Accept": "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`QuickBooks token refresh failed: ${error}`);
  }

  return res.json();
}

async function getValidAccessToken(user: User): Promise<{ accessToken: string; realmId: string }> {
  if (!user.qbAccessToken || !user.qbRefreshToken || !user.qbRealmId) {
    throw new Error("QuickBooks not connected");
  }

  const now = new Date();
  const tokenExpiry = user.qbTokenExpiresAt ? new Date(user.qbTokenExpiresAt) : new Date(0);
  const bufferMs = 5 * 60 * 1000;

  if (now.getTime() + bufferMs < tokenExpiry.getTime()) {
    return { accessToken: user.qbAccessToken, realmId: user.qbRealmId };
  }

  try {
    const tokens = await refreshQbToken(user.qbRefreshToken);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await storage.updateUserQbTokens(user.id, {
      qbAccessToken: tokens.access_token,
      qbRefreshToken: tokens.refresh_token,
      qbRealmId: user.qbRealmId,
      qbTokenExpiresAt: expiresAt,
    });
    return { accessToken: tokens.access_token, realmId: user.qbRealmId };
  } catch (err) {
    throw new Error(`QuickBooks token refresh failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

interface QbApiResponse {
  [key: string]: unknown;
  QueryResponse?: {
    Customer?: Array<{ Id: string; DisplayName: string }>;
    Payment?: Array<{ TotalAmt: number }>;
  };
  Customer?: { Id: string; DisplayName: string };
  Invoice?: { Id: string; SyncToken: string };
}

async function qbApiRequest(accessToken: string, realmId: string, method: string, path: string, body?: unknown): Promise<QbApiResponse> {
  const url = `${QB_BASE_URL}/v3/company/${realmId}/${path}`;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${accessToken}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`QuickBooks API error (${res.status}): ${error}`);
  }

  return res.json();
}

interface MapAbleLineItem {
  type: string;
  ndisItemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  subtotal: number;
  date: string;
}

interface QbLineItem {
  Amount: number;
  DetailType: "SalesItemLineDetail";
  Description: string;
  SalesItemLineDetail: {
    ItemRef: { value: string; name: string };
    Qty: number;
    UnitPrice: number;
    TaxCodeRef?: { value: string };
  };
}

interface QbInvoicePayload {
  Line: QbLineItem[];
  CustomerRef?: { value: string; name: string };
  TxnDate: string;
  DueDate: string;
  DocNumber: string;
  PrivateNote: string;
  CurrencyRef: { value: string };
  GlobalTaxCalculation?: string;
  TxnTaxDetail?: { TotalTax: number };
  Id?: string;
  SyncToken?: string;
}

async function findOrCreateQbItem(accessToken: string, realmId: string, itemName: string): Promise<{ value: string; name: string }> {
  const safeName = itemName.replace(/'/g, "\\'").substring(0, 100);
  try {
    const queryRes = await qbApiRequest(accessToken, realmId, "GET",
      `query?query=${encodeURIComponent(`SELECT * FROM Item WHERE Name = '${safeName}'`)}`);
    const items = (queryRes?.QueryResponse as Record<string, unknown> | undefined);
    const itemList = items?.Item as Array<{ Id: string; Name: string }> | undefined;
    if (itemList && itemList.length > 0) {
      return { value: itemList[0].Id, name: itemList[0].Name };
    }
  } catch {
  }

  try {
    const newItem = await qbApiRequest(accessToken, realmId, "POST", "item", {
      Name: safeName,
      Type: "Service",
      IncomeAccountRef: { value: "1", name: "Services" },
    });
    const created = newItem.Item as { Id: string; Name: string } | undefined;
    if (created) {
      return { value: created.Id, name: created.Name };
    }
  } catch {
  }

  return { value: "1", name: "Services" };
}

function mapInvoiceToQb(invoice: Invoice, participant: User, itemRef: { value: string; name: string }): QbInvoicePayload {
  const lineItems = (invoice.lineItems as MapAbleLineItem[] | null) || [];
  const gstAmount = Number(invoice.gstAmount || 0);
  const hasGst = gstAmount > 0;

  const qbLines: QbLineItem[] = lineItems.map((item) => ({
    Amount: item.subtotal || 0,
    DetailType: "SalesItemLineDetail" as const,
    Description: `${item.ndisItemCode || ""} - ${item.description || ""}`.trim(),
    SalesItemLineDetail: {
      ItemRef: itemRef,
      Qty: item.quantity || 1,
      UnitPrice: item.unitRate || 0,
      ...(hasGst ? { TaxCodeRef: { value: "TAX" } } : { TaxCodeRef: { value: "NON" } }),
    },
  }));

  return {
    Line: qbLines,
    TxnDate: invoice.periodStart,
    DueDate: invoice.periodEnd,
    DocNumber: `MAP-${invoice.id.substring(0, 8).toUpperCase()}`,
    PrivateNote: `MapAble Invoice ${invoice.id} for ${participant.fullName} (NDIS: ${participant.ndisNumber || "N/A"})`,
    CurrencyRef: { value: "AUD" },
    GlobalTaxCalculation: hasGst ? "TaxInclusive" : "NotApplicable",
    ...(hasGst ? { TxnTaxDetail: { TotalTax: gstAmount } } : {}),
  };
}

export async function pushInvoiceToQb(userId: string, invoiceId: string): Promise<Invoice | undefined> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");

  const invoice = await storage.getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found");

  try {
    await storage.updateInvoiceQbSync(invoiceId, { qbSyncStatus: "syncing", qbSyncError: null });

    const { accessToken, realmId } = await getValidAccessToken(user);

    let customerRef: { value: string; name: string } | undefined;
    try {
      const queryRes = await qbApiRequest(accessToken, realmId, "GET",
        `query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${user.fullName.replace(/'/g, "\\'")}'`)}`);
      const customers = queryRes?.QueryResponse?.Customer;
      if (customers && customers.length > 0) {
        customerRef = { value: customers[0].Id, name: customers[0].DisplayName };
      } else {
        const newCustomer = await qbApiRequest(accessToken, realmId, "POST", "customer", {
          DisplayName: user.fullName,
          PrimaryEmailAddr: user.email ? { Address: user.email } : undefined,
          Notes: `NDIS Number: ${user.ndisNumber || "N/A"}`,
        });
        if (newCustomer.Customer) {
          customerRef = { value: newCustomer.Customer.Id, name: newCustomer.Customer.DisplayName };
        }
      }
    } catch (err) {
      console.error("QB customer lookup/create failed:", err);
    }

    const itemRef = await findOrCreateQbItem(accessToken, realmId, "NDIS Support Services");
    const qbInvoiceData = mapInvoiceToQb(invoice, user, itemRef);
    if (customerRef) {
      qbInvoiceData.CustomerRef = customerRef;
    }

    let result: QbApiResponse;
    if (invoice.qbInvoiceId) {
      const existingRes = await qbApiRequest(accessToken, realmId, "GET", `invoice/${invoice.qbInvoiceId}`);
      qbInvoiceData.Id = invoice.qbInvoiceId;
      qbInvoiceData.SyncToken = existingRes.Invoice?.SyncToken;
      result = await qbApiRequest(accessToken, realmId, "POST", "invoice", qbInvoiceData as unknown as Record<string, unknown>);
    } else {
      result = await qbApiRequest(accessToken, realmId, "POST", "invoice", qbInvoiceData as unknown as Record<string, unknown>);
    }

    const qbInvoice = result.Invoice;
    if (!qbInvoice) throw new Error("QuickBooks did not return an Invoice object");
    return storage.updateInvoiceQbSync(invoiceId, {
      qbInvoiceId: qbInvoice.Id,
      qbSyncStatus: "synced",
      qbSyncError: null,
      qbLastSyncedAt: new Date(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("QB invoice push failed:", errorMessage);
    await storage.updateInvoiceQbSync(invoiceId, {
      qbSyncStatus: "error",
      qbSyncError: errorMessage,
    });
    throw err;
  }
}

export async function pullPaymentsFromQb(userId: string): Promise<{ updated: number; errors: string[] }> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");

  const { accessToken, realmId } = await getValidAccessToken(user);

  const invoiceList = await storage.getAllInvoicesForSync(userId);
  const syncedInvoices = invoiceList.filter(inv => inv.qbInvoiceId && inv.status !== "paid");

  let updated = 0;
  const errors: string[] = [];

  for (const invoice of syncedInvoices) {
    try {
      const paymentsRes = await qbApiRequest(accessToken, realmId, "GET",
        `query?query=${encodeURIComponent(`SELECT * FROM Payment WHERE Line.LinkedTxn.TxnId = '${invoice.qbInvoiceId}'`)}`);
      const payments = paymentsRes?.QueryResponse?.Payment;

      if (payments && payments.length > 0) {
        const totalPaid = payments.reduce((sum: number, p: { TotalAmt: number }) => sum + Number(p.TotalAmt || 0), 0);
        const invoiceTotal = Number(invoice.totalIncGst || invoice.totalAmount);

        if (totalPaid >= invoiceTotal) {
          await storage.updateInvoicePayment(invoice.id, { status: "paid" });
          await storage.updateInvoiceQbSync(invoice.id, {
            qbSyncStatus: "synced",
            qbLastSyncedAt: new Date(),
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

export async function syncAllInvoices(userId: string): Promise<{ pushed: number; paymentUpdates: number; errors: string[] }> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");

  const invoiceList = await storage.getAllInvoicesForSync(userId);
  let pushed = 0;
  const errors: string[] = [];

  for (const invoice of invoiceList) {
    if (!invoice.qbInvoiceId || invoice.qbSyncStatus === "error" || invoice.qbSyncStatus === "pending") {
      try {
        await pushInvoiceToQb(userId, invoice.id);
        pushed++;
      } catch (err) {
        errors.push(`Push failed for invoice ${invoice.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  const paymentResult = await pullPaymentsFromQb(userId);

  return {
    pushed,
    paymentUpdates: paymentResult.updated,
    errors: [...errors, ...paymentResult.errors],
  };
}

export async function handleQbWebhook(payload: { eventNotifications?: Array<{ realmId: string; dataChangeEvent?: { entities?: Array<{ name: string; id: string; operation: string }> } }> }): Promise<void> {
  if (!payload.eventNotifications) return;

  for (const notification of payload.eventNotifications) {
    const realmId = notification.realmId;
    const entities = notification.dataChangeEvent?.entities || [];

    const paymentEvents = entities.filter(e => e.name === "Payment");
    if (paymentEvents.length === 0) continue;

    const users = await storage.getUsersByQbRealmId(realmId);
    for (const user of users) {
      try {
        await pullPaymentsFromQb(user.id);
      } catch (err) {
        console.error(`QB webhook: failed to pull payments for user ${user.id}:`, err);
      }
    }
  }
}

let pollIntervalId: ReturnType<typeof setInterval> | null = null;

export function startPaymentPolling(intervalMs = 5 * 60 * 1000): void {
  if (pollIntervalId) return;
  pollIntervalId = setInterval(async () => {
    if (!qbEnabled()) return;
    try {
      const connectedUsers = await storage.getQbConnectedUsers();
      for (const user of connectedUsers) {
        try {
          await pullPaymentsFromQb(user.id);
        } catch (err) {
          console.error(`QB poll: payment pull failed for user ${user.id}:`, err);
        }
      }
    } catch (err) {
      console.error("QB payment polling error:", err);
    }
  }, intervalMs);
  console.log(`QB payment polling started (every ${intervalMs / 1000}s)`);
}

export function stopPaymentPolling(): void {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
    console.log("QB payment polling stopped");
  }
}
