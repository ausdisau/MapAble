import { reconcileBillingInvoice } from "@/lib/abilitypay/abilitypay-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  try {
    const { invoiceId } = await params;
    return jsonOk(await reconcileBillingInvoice({ invoiceId, actor }));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "RECONCILIATION_FAILED",
      403,
    );
  }
}
