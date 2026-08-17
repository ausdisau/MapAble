import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { buildEvidenceBundleFromInvoice } from "@/lib/ndis/readiness/evidence-bundle-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;
  const bundle = await buildEvidenceBundleFromInvoice(invoiceId, user.id);
  return jsonOk({ bundle, notSubmittedToNdia: true });
}
