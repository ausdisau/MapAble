/**
 * Chat guardrail audit-log and safeguarding record helpers for mapableau-new.
 *
 * Ported from REPL server/chat-guardrails.ts (DB write portion).
 * All writes go through a caller-supplied Prisma client handle to avoid
 * circular imports and stay compatible with both route handlers and server
 * actions.
 *
 * Prisma models required — see ports/mapableau-new/prisma/additions.prisma:
 *   ChatGuardrailAuditLog
 *   SafeguardingConcernFlag
 *   SafeguardingIncidentDraft
 *   SafeguardingComplaintDraft
 *   SafeguardingConsentRecord
 */

import type { GuardrailVerdict } from "./classify";

// ---------------------------------------------------------------------------
// Prisma type (minimal interface — accepts the real PrismaClient)
// ---------------------------------------------------------------------------

export interface AuditPrisma {
  chatGuardrailAuditLog: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
  };
  safeguardingConcernFlag: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
  };
  safeguardingIncidentDraft: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
  };
  safeguardingComplaintDraft: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
  };
  safeguardingConsentRecord: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
  };
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function writeGuardrailAuditLog(
  prisma: AuditPrisma,
  opts: {
    sessionId: string;
    userId?: string | null;
    turnIndex: number;
    input: string;
    verdict: GuardrailVerdict;
    outputBlocked: boolean;
  },
) {
  return prisma.chatGuardrailAuditLog.create({
    data: {
      sessionId: opts.sessionId,
      userId: opts.userId ?? null,
      turnIndex: opts.turnIndex,
      inputSnippet: opts.input.slice(0, 500),
      categories: opts.verdict.categories as string[],
      actions: opts.verdict.actions as string[],
      policyRefs: opts.verdict.policyRefs as string[],
      blocked: opts.verdict.blocked,
      outputBlocked: opts.outputBlocked,
    },
  });
}

export async function getGuardrailAuditLogs(
  prisma: AuditPrisma,
  opts: { sessionId?: string; limit?: number; offset?: number } = {},
) {
  return prisma.chatGuardrailAuditLog.findMany({
    where: opts.sessionId ? { sessionId: opts.sessionId } : {},
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    skip: opts.offset ?? 0,
  });
}

// ---------------------------------------------------------------------------
// Safeguarding concern flags
// ---------------------------------------------------------------------------

export async function flagSafeguardingConcern(
  prisma: AuditPrisma,
  opts: {
    sessionId: string;
    userId?: string | null;
    categories: string[];
    inputSnippet: string;
    severity: "critical" | "high" | "medium" | "low";
    smsAlertSent?: boolean;
  },
) {
  return prisma.safeguardingConcernFlag.create({
    data: {
      sessionId: opts.sessionId,
      userId: opts.userId ?? null,
      categories: opts.categories,
      inputSnippet: opts.inputSnippet.slice(0, 500),
      severity: opts.severity,
      status: "open",
      smsAlertSent: opts.smsAlertSent ?? false,
    },
  });
}

export async function getSafeguardingConcernFlags(
  prisma: AuditPrisma,
  opts: { status?: string; limit?: number; offset?: number } = {},
) {
  return prisma.safeguardingConcernFlag.findMany({
    where: opts.status ? { status: opts.status } : {},
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    skip: opts.offset ?? 0,
  });
}

export async function updateSafeguardingConcernStatus(
  prisma: AuditPrisma,
  id: string,
  status: "open" | "under_review" | "resolved" | "escalated",
  reviewerId?: string,
  reviewNote?: string,
) {
  return prisma.safeguardingConcernFlag.update({
    where: { id },
    data: {
      status,
      reviewerId: reviewerId ?? null,
      reviewNote: reviewNote ?? null,
      reviewedAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// Incident drafts
// ---------------------------------------------------------------------------

export async function logIncidentDraft(
  prisma: AuditPrisma,
  opts: {
    sessionId: string;
    userId?: string | null;
    incidentType: string;
    description: string;
    inputSnippet: string;
    severity: "critical" | "high" | "medium" | "low";
  },
) {
  return prisma.safeguardingIncidentDraft.create({
    data: {
      sessionId: opts.sessionId,
      userId: opts.userId ?? null,
      incidentType: opts.incidentType,
      description: opts.description,
      inputSnippet: opts.inputSnippet.slice(0, 500),
      severity: opts.severity,
      status: "draft",
    },
  });
}

// ---------------------------------------------------------------------------
// Complaint drafts
// ---------------------------------------------------------------------------

export async function logComplaintDraft(
  prisma: AuditPrisma,
  opts: {
    sessionId: string;
    userId?: string | null;
    description: string;
    inputSnippet: string;
  },
) {
  return prisma.safeguardingComplaintDraft.create({
    data: {
      sessionId: opts.sessionId,
      userId: opts.userId ?? null,
      description: opts.description,
      inputSnippet: opts.inputSnippet.slice(0, 500),
      status: "draft",
    },
  });
}

// ---------------------------------------------------------------------------
// Consent records
// ---------------------------------------------------------------------------

export async function recordConsentDecision(
  prisma: AuditPrisma,
  opts: {
    sessionId: string;
    userId?: string | null;
    decision: "withdrawn" | "granted" | "clarified";
    scope: string;
    inputSnippet: string;
  },
) {
  return prisma.safeguardingConsentRecord.create({
    data: {
      sessionId: opts.sessionId,
      userId: opts.userId ?? null,
      decision: opts.decision,
      scope: opts.scope,
      inputSnippet: opts.inputSnippet.slice(0, 500),
    },
  });
}

// ---------------------------------------------------------------------------
// Side-effects dispatcher — run all required DB writes for a verdict
// ---------------------------------------------------------------------------

export async function dispatchGuardrailSideEffects(
  prisma: AuditPrisma,
  opts: {
    sessionId: string;
    userId?: string | null;
    turnIndex: number;
    input: string;
    verdict: GuardrailVerdict;
    outputBlocked: boolean;
    /** Called when severity is critical (immediate_danger / self_harm) */
    sendSmsAlert?: (message: string) => Promise<void>;
  },
) {
  const { verdict } = opts;

  // Always write audit log
  await writeGuardrailAuditLog(prisma, {
    sessionId: opts.sessionId,
    userId: opts.userId,
    turnIndex: opts.turnIndex,
    input: opts.input,
    verdict,
    outputBlocked: opts.outputBlocked,
  });

  const c = verdict.categories;
  const isCritical =
    c.includes("immediate_danger") ||
    c.includes("self_harm_suicide") ||
    c.includes("abuse_neglect_exploitation");

  if (verdict.actions.includes("flag_safeguarding_concern")) {
    const flag = await flagSafeguardingConcern(prisma, {
      sessionId: opts.sessionId,
      userId: opts.userId,
      categories: c as string[],
      inputSnippet: opts.input,
      severity: isCritical ? "critical" : "high",
      smsAlertSent: false,
    });

    if (isCritical && opts.sendSmsAlert) {
      try {
        await opts.sendSmsAlert(
          `[MapAble URGENT] Safeguarding concern in session ${opts.sessionId}: ${c.join(", ")}. Input: "${opts.input.slice(0, 120)}"`,
        );
        await prisma.safeguardingConcernFlag.update({
          where: { id: flag.id },
          data: { smsAlertSent: true },
        });
      } catch (e) {
        console.error("[guardrail] SMS alert failed:", e);
      }
    }
  }

  if (verdict.actions.includes("log_incident_draft")) {
    const incidentType = c.includes("abuse_neglect_exploitation")
      ? "abuse_neglect_exploitation"
      : c.includes("privacy_breach")
        ? "privacy_breach"
        : "safeguarding_concern";
    await logIncidentDraft(prisma, {
      sessionId: opts.sessionId,
      userId: opts.userId,
      incidentType,
      description: `Auto-draft from chat guardrail. Categories: ${c.join(", ")}`,
      inputSnippet: opts.input,
      severity: isCritical ? "critical" : "high",
    });
  }

  if (verdict.actions.includes("log_complaint_draft")) {
    await logComplaintDraft(prisma, {
      sessionId: opts.sessionId,
      userId: opts.userId,
      description: `Auto-draft complaint from chat turn. Input: "${opts.input.slice(0, 300)}"`,
      inputSnippet: opts.input,
    });
  }

  if (verdict.actions.includes("record_consent")) {
    await recordConsentDecision(prisma, {
      sessionId: opts.sessionId,
      userId: opts.userId,
      decision: "withdrawn",
      scope: "data_sharing",
      inputSnippet: opts.input,
    });
  }
}
