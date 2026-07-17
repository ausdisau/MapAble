import { ZodError, z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getActiveBreakGlass,
  openBreakGlassSession,
  revokeBreakGlassSession,
} from "@/lib/security/break-glass";

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
  })
  .strict();

const revokeSchema = z
  .object({
    action: z.literal("revoke"),
    sessionId: z.string().min(1),
  })
  .strict();

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const active = getActiveBreakGlass(user.id);
  return jsonOk({ active });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

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

  try {
    const parsed = openSchema.parse(body);
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
    throw err;
  }
}
