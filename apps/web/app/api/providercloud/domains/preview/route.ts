import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import {
  buildSyntheticDomainPreview,
  canPreviewOrganisationDomain,
  DomainPreviewInputError,
  isDomainPreviewEnabled,
} from "@/lib/provider-cloud/domains/preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request): Promise<Response> {
  if (!isDomainPreviewEnabled()) {
    return Response.json({ error: "DOMAIN_PREVIEW_DISABLED" }, { status: 404, headers: noStore });
  }
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return Response.json({ error: "Expected JSON." }, { status: 415, headers: noStore });
  }
  const body = await request.text();
  if (body.length > 4096) {
    return Response.json({ error: "Request too large." }, { status: 413, headers: noStore });
  }
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return Response.json({ error: "Malformed JSON." }, { status: 400, headers: noStore });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Response.json({ error: "Expected an object." }, { status: 400, headers: noStore });
  }
  const input = data as Record<string, unknown>;
  const organisationId = input.organisationId;
  if (typeof organisationId !== "string" || organisationId.length > 200) {
    return Response.json({ error: "A provider organisation is required." }, { status: 400, headers: noStore });
  }
  // Host, x-mapable-tenant-id and client flags are never sources of authority.
  const memberOrganisationIds = await getUserOrganisationIds(actor.id);
  if (!canPreviewOrganisationDomain({
    actorRoles: actor.roles,
    organisationId,
    memberOrganisationIds,
  })) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  }
  try {
    const preview = buildSyntheticDomainPreview({
      organisationId,
      hostname: input.hostname,
      mode: input.mode,
    });
    return Response.json(preview, { status: 200, headers: noStore });
  } catch (error) {
    if (error instanceof DomainPreviewInputError) {
      return Response.json({ error: error.message }, { status: 400, headers: noStore });
    }
    throw error;
  }
}
