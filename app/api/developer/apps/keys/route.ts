import { z } from "zod";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { withAuthorization } from "@/lib/api/with-authorization";
import { isAdminRole } from "@/lib/auth/roles";
import { PARTNER_API_KEY_SCOPE_IDS } from "@/lib/developer-api/partner-api-key-scopes";
import {
  createPartnerApiKey,
  listPartnerApiKeys,
} from "@/lib/developer-api/partner-api-key-service";
import type { UserRole } from "@/types/mapable";

const createKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  partnerId: z.string().trim().min(1).optional(),
  scopes: z
    .array(z.enum(PARTNER_API_KEY_SCOPE_IDS))
    .min(1, "Select at least one scope"),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * List API keys for the caller's partner organisation(s).
 * Never returns key hashes or plain-text secrets.
 */
export const GET = withAuthorization(
  ["PROVIDER", "ADMIN"],
  async (_req, user) => {
    try {
      const partnerIds = await resolvePartnerIds(
        user.id,
        user.primaryRole,
        null
      );
      if (partnerIds instanceof Response) return partnerIds;

      const keys = await listPartnerApiKeys(partnerIds);
      return jsonOk({ keys });
    } catch (error) {
      console.error("[developer/apps/keys] GET failed", error);
      return jsonError("Failed to list API keys", 500);
    }
  }
);

/**
 * Create a Partner API Program key.
 * Returns the plain-text key once; only the hash is persisted.
 */
export const POST = withAuthorization(
  ["PROVIDER", "ADMIN"],
  async (req, user) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = createKeySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    try {
      const partnerIds = await resolvePartnerIds(
        user.id,
        user.primaryRole,
        parsed.data.partnerId ?? null
      );
      if (partnerIds instanceof Response) return partnerIds;

      const partnerId = parsed.data.partnerId ?? partnerIds[0];
      if (!partnerId) {
        return jsonError(
          "No partner organisation found. Join or create an organisation first.",
          400
        );
      }
      if (!partnerIds.includes(partnerId) && !isAdminRole(user.primaryRole)) {
        return jsonError(
          "You do not have access to this partner organisation",
          403
        );
      }

      const result = await createPartnerApiKey({
        partnerId,
        name: parsed.data.name,
        scopes: parsed.data.scopes,
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : null,
      });

      return jsonOk(result, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN";
      switch (message) {
        case "API_KEY_NAME_REQUIRED":
          return jsonError("Name is required", 400);
        case "API_KEY_PARTNER_REQUIRED":
          return jsonError("Partner organisation is required", 400);
        case "API_KEY_SCOPES_REQUIRED":
          return jsonError("Select at least one scope", 400);
        case "API_KEY_SCOPE_INVALID":
          return jsonError("One or more scopes are invalid", 400);
        default:
          console.error("[developer/apps/keys] POST failed", error);
          return jsonError("Failed to create API key", 500);
      }
    }
  }
);

async function resolvePartnerIds(
  userId: string,
  primaryRole: UserRole,
  requestedPartnerId: string | null
): Promise<string[] | Response> {
  if (isAdminRole(primaryRole)) {
    if (requestedPartnerId) return [requestedPartnerId];
    return getUserOrganisationIds(userId);
  }

  const orgIds = await getUserOrganisationIds(userId);
  if (orgIds.length === 0) {
    return jsonError(
      "No partner organisation found. Join or create an organisation first.",
      400
    );
  }
  return orgIds;
}
