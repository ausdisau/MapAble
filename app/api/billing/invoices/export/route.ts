import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { exportInvoice } from "@/lib/billing/core/export-service";
import { exportInvoiceSchema } from "@/lib/billing/core/schemas";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const body = await req.json();
  const parsed = exportInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await exportInvoice(
    user.id,
    parsed.data.invoiceId,
    parsed.data.format
  );
  if (!result.ok) return jsonError(result.error ?? "Export failed", 404);
  return jsonOk(result);
}
