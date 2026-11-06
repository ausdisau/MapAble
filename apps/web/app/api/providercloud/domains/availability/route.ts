import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { canPreviewOrganisationDomain } from "@/lib/provider-cloud/domains/preview";
import { isTppWholesaleReadOnlyEnabled } from "@/lib/provider-cloud/tpp-wholesale/config";
import {
  createTppWholesaleClient,
  TppWholesaleError,
} from "@/lib/provider-cloud/tpp-wholesale/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

/**
 * Genuine TPP read-only domain lookup: no writes, quotes, orders or DNS edits.
 * Enabled only in controlled non-production runtimes with verified fixed egress.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isTppWholesaleReadOnlyEnabled()) {
    return Response.json({ error: "TPP_READONLY_DISABLED" }, { status: 404, headers: noStore });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  }
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") {
    return Response.json({ error: "JSON_REQUIRED" }, { status: 415, headers: noStore });
  }
  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  }
  if (payload.length > 1024) {
    return Response.json({ error: "REQUEST_TOO_LARGE" }, { status: 413, headers: noStore });
  }
  let input: unknown;
  try {
    input = JSON.parse(payload);
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400, headers: noStore });
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  }
  const fields = input as Record<string, unknown>;
  if (
    typeof fields.organisationId !== "string" ||
    fields.organisationId.length > 200 ||
    fields.providerNoticeAccepted !== true
  ) {
    return Response.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  }
  const memberOrganisationIds = await getUserOrganisationIds(actor.id);
  if (!canPreviewOrganisationDomain({
    actorRoles: actor.roles,
    organisationId: fields.organisationId,
    memberOrganisationIds,
  })) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  }
  try {
    const result = await createTppWholesaleClient().checkAvailability(fields.domain);
    return Response.json(result, { status: 200, headers: noStore });
  } catch (error) {
    if (error instanceof TppWholesaleError) {
      const status = error.code === "INVALID_DOMAIN" ? 400
        : error.code === "TPP_CONFIGURATION_MISSING" ? 503 : 502;
      return Response.json({ error: error.code }, { status, headers: noStore });
    }
    // Unknown errors are not reflected to users; they may contain credentials.
    return Response.json({ error: "TPP_LOOKUP_FAILED" }, { status: 502, headers: noStore });
  }
}
