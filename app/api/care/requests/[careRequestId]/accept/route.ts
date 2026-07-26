import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { providerAcceptCareRequest } from "@/lib/care/care-request-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const orgIds = await getUserOrganisationIds(user.id);
  try {
    const request = await providerAcceptCareRequest(
      careRequestId,
      user.id,
      orgIds
    );
    return jsonOk({ request });
  } catch (e) {
    if (e instanceof Error && e.message === "ORG_ACCESS_DENIED") {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}
