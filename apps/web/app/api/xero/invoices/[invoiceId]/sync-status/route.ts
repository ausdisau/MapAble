import { requireApiSession } from "@/lib/api/auth-handler";
import { getXeroSyncStatus } from "@/lib/xero/xero-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;

  const status = await getXeroSyncStatus(invoiceId);
  return Response.json(status);
}
