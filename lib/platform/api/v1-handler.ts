import type { ApiScope } from "@prisma/client";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import {
  authenticateApiKey,
  type AuthenticatedApiContext,
} from "@/lib/platform/developer-auth/api-key-auth";
import { logApiAccess } from "@/lib/platform/developer-auth/access-log-service";
import { enforceParticipantAuthority } from "@/lib/platform/developer-auth/participant-gate";
import { apiErrorResponse } from "@/lib/platform/api/errors";

export type V1HandlerContext = AuthenticatedApiContext & {
  participantId?: string;
};

export type V1HandlerOptions = {
  requiredScope: ApiScope;
  requireParticipantId?: boolean;
  participantDomain?: string;
  participantAction?: string;
};

export async function withV1Auth(
  req: Request,
  options: V1HandlerOptions,
  handler: (ctx: V1HandlerContext) => Promise<Response>,
): Promise<Response> {
  const started = Date.now();

  if (!developerPlatformConfig.enabled) {
    return apiErrorResponse(
      "platform_disabled",
      "Developer platform is disabled",
      503,
    );
  }

  const ip = getClientIp(req);
  const allowed = checkIpRateLimit(ip, {
    windowMs: 60_000,
    max: developerPlatformConfig.defaultRateLimitPerMinute,
  });
  if (!allowed) {
    return apiErrorResponse("rate_limited", "Rate limit exceeded", 429);
  }

  const auth = await authenticateApiKey(req);
  if (!auth) {
    return apiErrorResponse("unauthorized", "Invalid or missing API key", 401);
  }

  if (auth.client.status !== "active") {
    return apiErrorResponse("forbidden", "API client is not active", 403);
  }

  if (!auth.scopes.includes(options.requiredScope)) {
    return apiErrorResponse(
      "scope_denied",
      `Missing required scope: ${options.requiredScope}`,
      403,
    );
  }

  const participantId = req.headers.get("x-participant-id") ?? undefined;

  if (options.requireParticipantId && !participantId) {
    return apiErrorResponse(
      "participant_authority_required",
      "x-participant-id header is required",
      400,
    );
  }

  if (participantId && options.participantDomain && options.participantAction) {
    const actorUserId = req.headers.get("x-delegate-user-id") ?? participantId;
    const authorized = await enforceParticipantAuthority({
      participantId,
      actorUserId,
      domain: options.participantDomain,
      action: options.participantAction,
      isServiceAccount: auth.isServiceAccount,
    });
    if (!authorized) {
      return apiErrorResponse(
        "participant_authority_required",
        "Participant authority grant required",
        403,
      );
    }
  }

  let response: Response;
  try {
    response = await handler({ ...auth, participantId });
  } catch (err) {
    response = apiErrorResponse(
      "validation_error",
      err instanceof Error ? err.message : "Request failed",
      400,
    );
  }

  void logApiAccess({
    apiClientId: auth.client.id,
    apiKeyId: auth.apiKeyId,
    serviceAccountId: auth.serviceAccountId,
    path: new URL(req.url).pathname,
    method: req.method,
    statusCode: response.status,
    durationMs: Date.now() - started,
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
    participantId,
  });

  response.headers.set("X-CareOS-Api-Version", "v1");
  return response;
}
