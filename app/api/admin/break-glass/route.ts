import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { withAuthorization } from "@/lib/auth/withAuthorization";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import {
  BreakGlassRequiredError,
  getActiveBreakGlass,
  openBreakGlassSession,
  revokeBreakGlassSession,
} from "@/lib/security/break-glass";
import {
  completeBreakGlassAfterAction,
  openHardenedBreakGlassSession,
} from "@/lib/trust-fabric/break-glass";
import {
  ACCESS_FIELD_CATEGORIES,
  type AccessFieldCategory,
} from "@/lib/trust-fabric/types";

const fieldCategorySchema = z
  .string()
  .refine(
    (value): value is AccessFieldCategory =>
      (ACCESS_FIELD_CATEGORIES as readonly string[]).includes(value),
    { message: "Invalid field category" },
  );

const openSchema = z
  .object({
    purpose: z.enum([
      "tenant_read",
      "tenant_write",
      "participant_support",
      "incident_response",
      "billing_exception",
      "security_investigation",
    ]),
    reason: z.string().min(12).max(2000),
    organisationId: z.string().min(1).optional(),
    participantId: z.string().min(1).optional(),
    ticketRef: z.string().max(128).optional(),
    ttlMinutes: z.number().int().min(5).max(240).optional(),
    fieldCategories: z.array(fieldCategorySchema).min(1).max(20).optional(),
    approverUserId: z.string().min(1).optional(),
  })
  .strict();

const revokeSchema = z
  .object({
    action: z.literal("revoke"),
    sessionId: z.string().min(1),
  })
  .strict();

const afterActionSchema = z
  .object({
    action: z.literal("after_action"),
    sessionId: z.string().min(1),
    note: z.string().min(12).max(2000),
  })
  .strict();

/** Strict platform ADMIN + MFA for all break-glass operations. */
const breakGlassAuth = {
  roles: ["ADMIN", "mapable_admin"] as const,
  requireMfa: true,
};

export const GET = withAuthorization(breakGlassAuth, async (_req, _ctx, user) => {
  const active = getActiveBreakGlass(user.id);
  return jsonOk({ active });
});

export const POST = withAuthorization(
  breakGlassAuth,
  async (req, _ctx, user) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "action" in body &&
      (body as { action?: string }).action === "revoke"
    ) {
      try {
        const parsed = revokeSchema.parse(body);
        const ok = revokeBreakGlassSession(parsed.sessionId);
        return jsonOk({ revoked: ok });
      } catch (err) {
        if (err instanceof ZodError) return zodErrorResponse(err);
        throw err;
      }
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "action" in body &&
      (body as { action?: string }).action === "after_action"
    ) {
      try {
        const parsed = afterActionSchema.parse(body);
        await completeBreakGlassAfterAction({
          sessionId: parsed.sessionId,
          adminUserId: user.id,
          note: parsed.note,
        });
        return jsonOk({ afterActionCompleted: true });
      } catch (err) {
        if (err instanceof ZodError) return zodErrorResponse(err);
        if (err instanceof BreakGlassRequiredError) {
          return jsonError(err.message, err.status);
        }
        throw err;
      }
    }

    try {
      const parsed = openSchema.parse(body);

      if (isTrustFabricEnabled()) {
        if (!parsed.fieldCategories?.length) {
          return jsonError(
            "fieldCategories required when Trust Fabric is enabled",
            400,
          );
        }
        const session = await openHardenedBreakGlassSession({
          admin: user,
          purpose: parsed.purpose,
          reason: parsed.reason,
          organisationId: parsed.organisationId,
          participantId: parsed.participantId,
          fieldCategories: parsed.fieldCategories,
          ticketRef: parsed.ticketRef,
          ttlMinutes: parsed.ttlMinutes,
          approverUserId: parsed.approverUserId,
        });
        return jsonOk({ session }, 201);
      }

      const session = openBreakGlassSession({
        admin: user,
        purpose: parsed.purpose,
        reason: parsed.reason,
        organisationId: parsed.organisationId,
        participantId: parsed.participantId,
        ticketRef: parsed.ticketRef,
        ttlMinutes: parsed.ttlMinutes,
      });
      return jsonOk({ session }, 201);
    } catch (err) {
      if (err instanceof ZodError) return zodErrorResponse(err);
      if (err instanceof BreakGlassRequiredError) {
        return jsonError(err.message, err.status);
      }
      throw err;
    }
  },
);
