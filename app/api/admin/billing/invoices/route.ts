import type { BillingInvoiceStatus } from "@prisma/client";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { adminSearchInvoices } from "@/lib/billing/core/invoice-service";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? undefined;
  const providerId = url.searchParams.get("providerId") ?? undefined;
  const status = url.searchParams.get("status") as
    | BillingInvoiceStatus
    | undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const invoices = await adminSearchInvoices({
    userId,
    providerId,
    status,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  const flagged = invoices.filter(
    (inv) =>
      inv.status === "failed" ||
      inv.payments.some(
        (p) => p.status === "disputed" || p.status === "failed"
      ) ||
      inv.planManagerExportStatus === "error" ||
      inv.xeroExportStatus === "error"
  );

  return jsonOk({ invoices, flaggedCount: flagged.length, flagged });
}
