import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  assertRecipientAccess,
  createDashboardLinkForRecipient,
} from "@/lib/payouts/recipient-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const access = await assertRecipientAccess(id, user.id, isAdminRole(user.primaryRole));
  if (!access.ok) return jsonError(access.error, 403);

  try {
    const link = await createDashboardLinkForRecipient(id);
    return jsonOk({ dashboardUrl: link.url });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to create dashboard link", 500);
  }
}
