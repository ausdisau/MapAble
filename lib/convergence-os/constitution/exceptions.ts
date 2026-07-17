import type { ConstitutionExceptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const TERMINAL: ConstitutionExceptionStatus[] = [
  "approved",
  "approved_with_conditions",
  "rejected",
  "expired",
  "revoked",
  "closed",
];

/**
 * Exception workflow helpers. AI may draft; AI cannot approve.
 */
export async function createExceptionDraft(input: {
  ruleKey: string;
  businessReason: string;
  technicalReason?: string;
  affectedCapability?: string;
  affectedParticipants?: string;
  durationDays?: number;
  risk?: string;
  compensatingControls?: string;
  monitoring?: string;
  rollback?: string;
  removalPlan?: string;
  owner?: string;
}) {
  const rule = await prisma.architectureRule.findUnique({
    where: { ruleKey: input.ruleKey },
  });
  if (!rule) throw new Error(`Unknown rule ${input.ruleKey}`);

  const expiresAt =
    input.durationDays != null
      ? new Date(Date.now() + input.durationDays * 86_400_000)
      : null;

  return prisma.architectureRuleException.create({
    data: {
      ruleId: rule.id,
      status: "draft",
      businessReason: input.businessReason,
      technicalReason: input.technicalReason,
      affectedCapability: input.affectedCapability,
      affectedParticipants: input.affectedParticipants,
      durationDays: input.durationDays,
      expiresAt,
      risk: input.risk,
      compensatingControls: input.compensatingControls,
      monitoring: input.monitoring,
      rollback: input.rollback,
      removalPlan: input.removalPlan,
      owner: input.owner,
    },
  });
}

export async function transitionException(input: {
  exceptionId: string;
  nextStatus: ConstitutionExceptionStatus;
  actorIsHuman: boolean;
}) {
  if (!input.actorIsHuman) {
    throw new Error("AI cannot approve or advance constitution exceptions");
  }

  const current = await prisma.architectureRuleException.findUnique({
    where: { id: input.exceptionId },
  });
  if (!current) throw new Error("Exception not found");

  const allowed = allowedTransitions(current.status);
  if (!allowed.includes(input.nextStatus)) {
    throw new Error(
      `Cannot transition exception from ${current.status} to ${input.nextStatus}`
    );
  }

  return prisma.architectureRuleException.update({
    where: { id: input.exceptionId },
    data: { status: input.nextStatus },
  });
}

export function allowedTransitions(
  status: ConstitutionExceptionStatus
): ConstitutionExceptionStatus[] {
  switch (status) {
    case "draft":
      return ["submitted", "closed"];
    case "submitted":
      return ["architecture_review", "rejected", "closed"];
    case "architecture_review":
      return [
        "security_review",
        "privacy_review",
        "accessibility_review",
        "approved",
        "approved_with_conditions",
        "rejected",
      ];
    case "security_review":
    case "privacy_review":
    case "accessibility_review":
      return ["approved", "approved_with_conditions", "rejected", "architecture_review"];
    case "approved":
    case "approved_with_conditions":
      return ["expired", "revoked", "closed"];
    case "rejected":
    case "expired":
    case "revoked":
    case "closed":
      return [];
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export async function expireTemporaryExceptions(now = new Date()) {
  const due = await prisma.architectureRuleException.findMany({
    where: {
      expiresAt: { lte: now },
      status: { in: ["approved", "approved_with_conditions"] },
    },
  });

  for (const item of due) {
    await prisma.architectureRuleException.update({
      where: { id: item.id },
      data: { status: "expired" },
    });
  }

  return { expired: due.length, ids: due.map((d) => d.id) };
}

export function isTerminalExceptionStatus(
  status: ConstitutionExceptionStatus
): boolean {
  return TERMINAL.includes(status);
}
