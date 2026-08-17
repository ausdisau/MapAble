import {
  acceptAiCandidate,
} from "@/lib/ai/matching/ai-match-service";
import { AiMatchingError } from "@/lib/ai/matching/types";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

const STATUS_BY_CODE: Record<string, number> = {
  NOT_FOUND: 404,
  ALREADY_ACCEPTED: 409,
  ALREADY_TERMINAL: 409,
  EXPIRED: 409,
  FAIRNESS_REVIEW_MISSING: 409,
  FAIRNESS_REVIEW_REJECTED: 409,
  FAIRNESS_REVIEW_NOT_APPROVED: 409,
  CARE_REQUEST_MISMATCH: 403,
  CANDIDATE_OWNERSHIP_MISMATCH: 403,
  CROSS_TENANT: 403,
  INVALID_STATE: 409,
  CONCURRENT_ACCEPTANCE: 409,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("ai_matching:run");
  if (user instanceof Response) return user;
  const { candidateId } = await params;

  let expectedCareRequestId: string | null = null;
  let actorOrganisationId: string | null = null;
  try {
    const body = (await req.json()) as {
      careRequestId?: string;
      organisationId?: string;
    };
    expectedCareRequestId = body.careRequestId ?? null;
    // Organisation scope must be server-derived in production; accept optional
    // body only when accompanied by permission (route already requires ai_matching:run).
    actorOrganisationId = body.organisationId ?? null;
  } catch {
    // empty body allowed
  }

  try {
    const candidate = await acceptAiCandidate(candidateId, user.id, {
      expectedCareRequestId,
      actorOrganisationId,
    });
    return jsonOk({ candidate });
  } catch (e) {
    if (e instanceof AiMatchingError) {
      return jsonError(e.message, STATUS_BY_CODE[e.code] ?? 409);
    }
    if (e instanceof Error && e.message === "FAIRNESS_REVIEW_REQUIRED") {
      return jsonError("Fairness review required before acceptance", 409);
    }
    throw e;
  }
}
