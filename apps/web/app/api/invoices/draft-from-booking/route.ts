import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { bookingId } = await req.json();
  if (!bookingId) return jsonError("bookingId required");

  const invoice = await createInvoiceDraftFromBooking(bookingId, user.id);
  return jsonOk({ invoice }, 201);
}
