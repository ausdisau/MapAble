import { requireApiSession } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertOrganisationAccess,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getTransportQuote,
  getTransportQuoteForAccess,
} from "@/lib/transport/quotes/quote-service";

/**
 * GET quote by id. Participant owner or org transport staff.
 * Cross-tenant → 404.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const asParticipant = await getTransportQuoteForAccess({
    quoteId: id,
    participantUserId: user.id,
  });
  if (asParticipant) {
    return jsonOk({ quote: asParticipant });
  }

  const raw = await getTransportQuote(id);
  if (!raw) {
    return jsonError("Not found", 404);
  }

  try {
    await assertOrganisationAccess(
      user,
      raw.organisationId,
      "transport:manage:org",
    );
    return jsonOk({ quote: raw });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError("Not found", 404);
    }
    throw e;
  }
}
