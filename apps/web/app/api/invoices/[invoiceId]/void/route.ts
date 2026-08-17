import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { voidInvoice } from "@/lib/invoices/invoice-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;

  const invoice = await voidInvoice(invoiceId, user.id);
  return jsonOk({ invoice });
}
