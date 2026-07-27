import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createConsentProposalToken,
  verifyConsentProposalToken,
} from "@/lib/intelligence/careos/approvals/proposal-token";
import { careOSFeatureFlags } from "@/lib/intelligence/careos/config/feature-flags";
import { CareOSConsentError } from "@/lib/intelligence/careos/consent/consent-service";
import { buildCareOSContext } from "@/lib/intelligence/careos/context/context-builder";
import { careTransportMissionInputSchema } from "@/lib/intelligence/careos/missions/mission-types";
import { runCareOSManager } from "@/lib/intelligence/careos/orchestrator/careos-orchestrator";
import { CareOSToolError } from "@/lib/intelligence/careos/tools/registry";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!careOSFeatureFlags.enabled || !careOSFeatureFlags.coreEnabled) {
    return jsonError("FEATURE_DISABLED", 503);
  }
  try {
    const input = careTransportMissionInputSchema.parse(await request.json());
    const approvedScope =
      input.consentProposalToken && input.useAccessibilityProfile
        ? verifyConsentProposalToken(input.consentProposalToken, user.id)
        : undefined;
    const context = await buildCareOSContext({
      user,
      requestId: approvedScope?.requestId,
      requestScopedConsent: approvedScope ? [approvedScope.scope] : [],
    });
    const result = await runCareOSManager({ input, context });
    return jsonOk({
      result,
      requestId: context.requestId,
      consentProposal:
        result.consentRequired.includes("profile.accessibility")
          ? {
              token: createConsentProposalToken(user.id, context.requestId),
              scope: "profile.accessibility",
              expiresInMinutes: 10,
            }
          : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof CareOSConsentError) {
      return jsonOk(
        {
          error: "CONSENT_REQUIRED",
          missingScopes: error.missingScopes,
          continueWithoutCareOS: "/care/new",
        },
        403
      );
    }
    if (error instanceof CareOSToolError) {
      return jsonError(error.code, error.code === "FEATURE_DISABLED" ? 503 : 403);
    }
    if (error instanceof Error && error.message === "AUTHORITY_DENIED") {
      return jsonError("AUTHORITY_DENIED", 403);
    }
    return jsonError("SERVICE_UNAVAILABLE", 503);
  }
}
