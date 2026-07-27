import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  verifyRequestMfa,
  withAuthorization,
} from "@/lib/auth/withAuthorization";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import {
  BreakGlassRequiredError,
  getActiveBreakGlass,
  openBreakGlassSession,
  revokeBreakGlassSession,
} from "@/lib/security/break-glass";
import { verifyBreakGlassMfaToken } from "@/lib/security/break-glass-mfa";
import {
  completeBreakGlassAfterAction,
  openHardenedBreakGlassSession,
} from "@/lib/trust/fabric/break-glass";
import {
  ACCESS_FIELD_CATEGORIES,
  type AccessFieldCategory,
} from "@/lib/trust/fabric/types";

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

/**
 * Immutable audit write before any PHI / session material is returned.
 * Uses AuditEvent (`audit_events`) with admin ID, IP (via request meta),
 * timestamp (DB default), and the break-glass reason.
 */
async function auditBreakGlassAction(input: {
  admin: CurrentUser;
  action: string;
  reason: string;
  entityId?: string | null;
  organisationId?: string | null;
  participantId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createAuditEvent({
    actorUserId: input.admin.id,
    actorRole: input.admin.primaryRole,
    action: input.action,
    entityType: "BreakGlassAccessSession",
    entityId: input.entityId ?? null,
    organisationId: input.organisationId ?? null,
    participantId: input.participantId ?? null,
    metadata: {
      reason: input.reason,
      immutable: true,
      ...input.metadata,
    },
  });
}

/**
 * Strict platform admin + fresh MFA for all break-glass operations.
 * Accepts platform step-up (`x-mfa-assertion` / session mfaVerified) or a
 * cryptographically verified `x-mfa-token` (WebAuthn / passkey step-up).
 * Mock short-token acceptance is removed — fail closed.
 */
const breakGlassAuth = {
  roles: ["mapable_admin"] as const,
  authorize: async (user: CurrentUser, request: Request) => {
    if (await verifyRequestMfa(request, user.id)) return true;

    const token =
      request.headers.get("x-mfa-token") ??
      request.headers.get("x-mfa-assertion");
    const verified = verifyBreakGlassMfaToken(token, user.id);
    if (verified.ok) return true;

    return NextResponse.json(
      {
        error: "Forbidden",
        code: "MFA_REQUIRED",
        message:
          "Multi-factor authentication is required. Provide a valid x-mfa-assertion step-up token.",
      },
      { status: 403 },
    );
  },
};

export const GET = withAuthorization(
  breakGlassAuth,
  async (_req, _ctx, user) => {
    await auditBreakGlassAction({
      admin: user,
      action: "break_glass.active_queried",
      reason: "Admin queried active break-glass session status",
    });

    const active = getActiveBreakGlass(user.id);
    return jsonOk({ active });
  },
);

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

        await auditBreakGlassAction({
          admin: user,
          action: "break_glass.revoked",
          reason: `Admin revoked break-glass session ${parsed.sessionId}`,
          entityId: parsed.sessionId,
          metadata: { sessionId: parsed.sessionId },
        });

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

        await auditBreakGlassAction({
          admin: user,
          action: "break_glass.after_action",
          reason: parsed.note,
          entityId: parsed.sessionId,
          metadata: { sessionId: parsed.sessionId },
        });

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

      // Mandatory immutable audit BEFORE granting access / returning session PHI.
      await auditBreakGlassAction({
        admin: user,
        action: "break_glass.opened",
        reason: parsed.reason,
        organisationId: parsed.organisationId ?? null,
        participantId: parsed.participantId ?? null,
        metadata: {
          purpose: parsed.purpose,
          ticketRef: parsed.ticketRef ?? null,
          ttlMinutes: parsed.ttlMinutes ?? null,
          fieldCategories: parsed.fieldCategories ?? null,
          trustFabric: isTrustFabricEnabled(),
        },
      });

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
