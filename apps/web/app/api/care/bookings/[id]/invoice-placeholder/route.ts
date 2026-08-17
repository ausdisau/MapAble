import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createInvoicePlaceholderForBooking } from "@/lib/care/care-invoice-link-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const link = await createInvoicePlaceholderForBooking(id, user);
    return jsonOk({ invoiceLink: link });
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_LOG_REQUIRED") {
      return jsonError(
        "A participant-confirmed service log is required before generating an invoice placeholder.",
        400
      );
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}
