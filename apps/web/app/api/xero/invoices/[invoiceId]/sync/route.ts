import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { syncInvoiceToXeroPlaceholder } from "@/lib/xero/xero-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;

  const result = await syncInvoiceToXeroPlaceholder(invoiceId);
  return jsonOk(result, result.ok ? 200 : 503);
}
