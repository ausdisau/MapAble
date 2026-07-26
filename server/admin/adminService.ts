import type {
  CareBookingStatus,
  IncidentStatus,
  MapAbleUserRole,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { getAtRiskItems } from "@/lib/admin/service-ops";
import { logAdminSensitiveAccess } from "@/lib/audit/audit-event-service";
import { adminSearchInvoices } from "@/lib/billing/core/invoice-service";
import { countOpenComplaints } from "@/lib/trust/safety/queue-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

import type {
  AdminListQuery,
  CommandCentreResponse,
  HighRiskItem,
} from "./adminSchemas";

export type AdminDataScope = "full" | "billing" | "safeguarding" | "limited";

const CREDENTIAL_ALERT_STATUSES = ["expired", "pending_review"] as const;

export function resolveAdminDataScope(role: UserRole): AdminDataScope {
  if (isAdminRole(role)) return "full";
  const hasParticipants = hasPermission(role, "admin:participants:read");
  const hasSafeguarding = hasPermission(role, "admin:safeguarding:read");
  const hasBilling = hasPermission(role, "admin:billing:read");
  if (hasParticipants && hasSafeguarding) return "full";
  if (hasSafeguarding && !hasBilling) return "safeguarding";
  if (hasBilling && !hasParticipants && !hasSafeguarding) return "billing";
  return "limited";
}

export async function getCommandCentre(
  actor: CurrentUser
): Promise<CommandCentreResponse> {
  const scope = resolveAdminDataScope(actor.primaryRole);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    careDraftOrSubmitted,
    shiftsAwaitingApproval,
    recentTransformAudits,
    atRiskItems,
    workerCredentialCount,
    billingInvoices,
    openSafeguardingIncidents,
    activeRiskFlags,
    fairnessReview,
    aiMatchReview,
    pendingMatchRuns,
    unresolvedComplaints,
    persistedAgentRunsBlocked,
  ] = await Promise.all([
    prisma.careRequest.count({
      where: { status: { in: ["draft", "submitted"] } },
    }),
    prisma.careShift.count({
      where: { status: "awaiting_participant_approval" },
    }),
    prisma.auditEvent.findMany({
      where: {
        action: "care_support_transform.completed",
        createdAt: { gte: sevenDaysAgo },
      },
      select: { metadata: true },
    }),
    getAtRiskItems(),
    prisma.workerProfile.count({
      where: {
        active: true,
        OR: [
          { wwccStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
          { firstAidStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
          { workerScreeningStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
          { verificationStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
        ],
      },
    }),
    adminSearchInvoices({}),
    prisma.incidentReport.count({
      where: {
        safeguardingConcern: true,
        status: { notIn: ["resolved", "closed"] },
      },
    }),
    prisma.careRiskFlag.count({ where: { active: true } }),
    prisma.fairnessCheck.count({
      where: { status: "review_required" },
    }),
    prisma.aiMatchRun.count({
      where: {
        status: { in: ["draft", "generated", "fairness_review_required"] },
      },
    }),
    prisma.matchRun.count({ where: { status: "pending" } }),
    countOpenComplaints(),
    prisma.agentRun.count({
      where: {
        humanReviewRequired: true,
        status: { in: ["started", "completed", "blocked"] },
      },
    }),
  ]);

  let transformReviewAudits = 0;
  let guardrailAudits = 0;
  for (const ev of recentTransformAudits) {
    const meta = (ev.metadata ?? {}) as Record<string, unknown>;
    if (meta.humanReviewRequired === true) transformReviewAudits += 1;
    const triggers = meta.guardrailTriggers;
    if (Array.isArray(triggers) && triggers.length > 0) guardrailAudits += 1;
  }

  const unassignedBookings = await prisma.careBooking.count({
    where: {
      status: { in: ["pending_provider", "accepted"] },
      bookingWorkers: { none: {} },
    },
  });

  const flaggedBilling = billingInvoices.filter(
    (inv) =>
      inv.status === "failed" ||
      inv.payments.some(
        (p) => p.status === "disputed" || p.status === "failed"
      ) ||
      inv.planManagerExportStatus === "error" ||
      inv.xeroExportStatus === "error"
  );

  const pendingParticipantConfirmations =
    careDraftOrSubmitted + shiftsAwaitingApproval + transformReviewAudits;
  const bookingsAtRisk = atRiskItems.length + unassignedBookings;
  const agentRunsNeedingReview =
    fairnessReview + aiMatchReview + pendingMatchRuns + persistedAgentRunsBlocked;

  const highRiskItems: HighRiskItem[] = [];

  for (const item of atRiskItems.slice(0, 8)) {
    highRiskItems.push({
      id: `${item.type}-${item.id}`,
      domain: item.type === "transport" ? "bookings" : "bookings",
      severity: "high",
      title: "Booking at risk",
      summary: item.reason,
      entityType: item.type,
      entityId: item.id,
      href:
        item.type === "care"
          ? `/admin/care/requests/${item.id}`
          : `/admin/transport/bookings/${item.id}`,
    });
  }

  if (unassignedBookings > 0) {
    highRiskItems.push({
      id: "unassigned-care-bookings",
      domain: "bookings",
      severity: "medium",
      title: "Care bookings without assigned worker",
      summary: `${unassignedBookings} booking(s) need worker assignment.`,
      href: "/admin/ops/bookings",
    });
  }

  if (openSafeguardingIncidents + activeRiskFlags > 0 && scope !== "billing") {
    highRiskItems.push({
      id: "safeguarding-alerts",
      domain: "safeguarding",
      severity: "high",
      title: "Safeguarding alerts",
      summary: `${openSafeguardingIncidents} open incident(s), ${activeRiskFlags} active risk flag(s).`,
      href: "/admin/ops/safeguarding",
    });
  }

  if (flaggedBilling.length > 0 && scope !== "safeguarding") {
    highRiskItems.push({
      id: "billing-exceptions",
      domain: "billing",
      severity: "medium",
      title: "Billing exceptions",
      summary: `${flaggedBilling.length} invoice(s) need attention.`,
      href: "/admin/ops/billing",
    });
  }

  if (guardrailAudits > 0) {
    highRiskItems.push({
      id: "guardrail-blocks",
      domain: "agent-runs",
      severity: "high",
      title: "Care transformer guardrail blocks",
      summary: `${guardrailAudits} recent transform(s) triggered guardrails.`,
      href: "/admin/ops/agent-runs",
      aiGenerated: true,
    });
  }

  if (agentRunsNeedingReview > 0) {
    highRiskItems.push({
      id: "agent-review-queue",
      domain: "agent-runs",
      severity: "medium",
      title: "Agent runs needing review",
      summary: `${agentRunsNeedingReview} run(s) in review queue.`,
      href: "/admin/ops/agent-runs",
      aiGenerated: true,
    });
  }

  if (unresolvedComplaints > 0 && scope !== "billing") {
    highRiskItems.push({
      id: "unresolved-complaints",
      domain: "safeguarding",
      severity: "medium",
      title: "Unresolved complaints",
      summary: `${unresolvedComplaints} complaint(s) in the trust & safety queue.`,
      href: "/admin/ops/trust-safety",
    });
  }

  return {
    metrics: {
      pendingParticipantConfirmations,
      bookingsAtRisk,
      workerCredentialExpiries: workerCredentialCount,
      billingExceptions: flaggedBilling.length,
      safeguardingAlerts: openSafeguardingIncidents + activeRiskFlags,
      unresolvedComplaints,
      guardrailBlocks: guardrailAudits,
      agentRunsNeedingReview,
    },
    highRiskItems: highRiskItems.slice(0, 20),
  };
}

export async function listParticipants(
  actor: CurrentUser,
  query: AdminListQuery
) {
  const scope = resolveAdminDataScope(actor.primaryRole);
  const where = query.q
    ? {
        OR: [
          { displayName: { contains: query.q, mode: "insensitive" as const } },
          { user: { email: { contains: query.q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.participantProfile.findMany({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            careRequests: {
              where: { status: { in: ["draft", "submitted", "awaiting_admin_review"] } },
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.participantProfile.count({ where }),
  ]);

  const redactClinical = scope === "billing";

  return {
    items: rows.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      homeSuburb: p.homeSuburb,
      homeState: p.homeState,
      accessRequirementsSummary: redactClinical ? undefined : undefined,
      participantNotes: redactClinical ? undefined : p.participantNotes ?? undefined,
      pendingCareRequests: p.user.careRequests.length,
      href: `/admin/participants/${p.userId}`,
    })),
    total,
    scope,
  };
}

export async function listWorkers(actor: CurrentUser, query: AdminListQuery) {
  const where = {
    active: true,
    ...(query.atRiskOnly
      ? {
          OR: [
            { wwccStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
            { firstAidStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
            { workerScreeningStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
            { verificationStatus: { in: [...CREDENTIAL_ALERT_STATUSES] } },
          ],
        }
      : {}),
    ...(query.q
      ? { displayName: { contains: query.q, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.workerProfile.findMany({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workerProfile.count({ where }),
  ]);

  return {
    items: rows.map((w) => {
      const credentialAlert =
        CREDENTIAL_ALERT_STATUSES.includes(
          w.wwccStatus as (typeof CREDENTIAL_ALERT_STATUSES)[number]
        ) ||
        CREDENTIAL_ALERT_STATUSES.includes(
          w.firstAidStatus as (typeof CREDENTIAL_ALERT_STATUSES)[number]
        ) ||
        CREDENTIAL_ALERT_STATUSES.includes(
          w.workerScreeningStatus as (typeof CREDENTIAL_ALERT_STATUSES)[number]
        ) ||
        CREDENTIAL_ALERT_STATUSES.includes(
          w.verificationStatus as (typeof CREDENTIAL_ALERT_STATUSES)[number]
        );
      return {
        id: w.id,
        displayName: w.displayName,
        organisationId: w.organisationId,
        verificationStatus: w.verificationStatus,
        wwccStatus: w.wwccStatus,
        firstAidStatus: w.firstAidStatus,
        workerScreeningStatus: w.workerScreeningStatus,
        credentialAlert,
        href: `/admin/workers/${w.id}`,
      };
    }),
    total,
  };
}

export async function listBookings(actor: CurrentUser, query: AdminListQuery) {
  const atRisk = await getAtRiskItems();
  const atRiskCareIds = new Set(
    atRisk.filter((a) => a.type === "care").map((a) => a.id)
  );

  const atRiskStatuses: CareBookingStatus[] = ["pending_provider", "accepted"];
  const where = query.atRiskOnly
    ? {
        OR: [
          { careRequestId: { in: [...atRiskCareIds] } },
          {
            status: { in: atRiskStatuses },
            bookingWorkers: { none: {} },
          },
        ],
      }
    : undefined;

  const [rows, total] = await Promise.all([
    prisma.careBooking.findMany({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy: { createdAt: "desc" },
      include: { bookingWorkers: { select: { id: true } } },
    }),
    prisma.careBooking.count({ where }),
  ]);

  return {
    items: rows.map((b) => {
      const riskItem = atRisk.find(
        (a) => a.type === "care" && a.id === b.careRequestId
      );
      const unassigned = b.bookingWorkers.length === 0;
      const atRiskFlag = Boolean(riskItem) || unassigned;
      return {
        id: b.id,
        careRequestId: b.careRequestId,
        participantId: b.participantId,
        status: b.status,
        organisationId: b.organisationId,
        atRisk: atRiskFlag,
        atRiskReason: riskItem?.reason ?? (unassigned ? "No worker assigned" : undefined),
        href: `/admin/care/bookings/${b.id}`,
      };
    }),
    total,
  };
}

export async function listSafeguarding(
  actor: CurrentUser,
  query: AdminListQuery
) {
  const scope = resolveAdminDataScope(actor.primaryRole);
  const includeNotes = scope === "full" || scope === "safeguarding";

  const closedStatuses: IncidentStatus[] = ["resolved", "closed"];
  const incidentWhere = {
    OR: [
      { safeguardingConcern: true },
      { status: { notIn: closedStatuses } },
    ],
    ...(query.q
      ? { title: { contains: query.q, mode: "insensitive" as const } }
      : {}),
  };

  const [incidents, riskFlags, incidentTotal, flagTotal] = await Promise.all([
    prisma.incidentReport.findMany({
      where: incidentWhere,
      take: query.limit,
      skip: query.offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.careRiskFlag.findMany({
      where: { active: true, ...(query.q ? { flagType: { contains: query.q, mode: "insensitive" as const } } : {}) },
      take: query.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.incidentReport.count({ where: incidentWhere }),
    prisma.careRiskFlag.count({ where: { active: true } }),
  ]);

  if (includeNotes && incidents.length > 0) {
    await logAdminSensitiveAccess({
      actorUserId: actor.id,
      actorRole: actor.primaryRole as MapAbleUserRole,
      entityType: "safeguarding_list",
      entityId: "batch",
    });
  }

  const items = [
    ...incidents.map((i) => ({
      id: i.id,
      kind: "incident" as const,
      title: i.title,
      severity: i.severity,
      status: i.status,
      occurredAt: i.occurredAt?.toISOString() ?? null,
      descriptionPreview: includeNotes
        ? i.description.slice(0, 120)
        : null,
      href: `/admin/incidents/${i.id}`,
    })),
    ...riskFlags.map((f) => ({
      id: f.id,
      kind: "risk_flag" as const,
      title: f.flagType,
      severity: f.severity,
      status: f.active ? "active" : "inactive",
      occurredAt: f.createdAt.toISOString(),
      descriptionPreview: includeNotes
        ? (f.notes?.slice(0, 120) ?? null)
        : null,
      href: `/admin/participants/${f.participantId}`,
    })),
  ];

  return { items, total: incidentTotal + flagTotal, scope };
}

export async function listBillingExceptions(
  actor: CurrentUser,
  query: AdminListQuery
) {
  const scope = resolveAdminDataScope(actor.primaryRole);
  const invoices = await adminSearchInvoices({});

  const flagged = invoices.filter(
    (inv) =>
      inv.status === "failed" ||
      inv.payments.some(
        (p) => p.status === "disputed" || p.status === "failed"
      ) ||
      inv.planManagerExportStatus === "error" ||
      inv.xeroExportStatus === "error"
  );

  const slice = flagged.slice(query.offset, query.offset + query.limit);

  return {
    items: slice.map((inv) => {
      let reason = "Invoice needs review";
      if (inv.status === "failed") reason = "Payment failed";
      else if (inv.planManagerExportStatus === "error")
        reason = "Plan manager export error";
      else if (inv.xeroExportStatus === "error") reason = "Accounting export error";
      else if (inv.payments.some((p) => p.status === "disputed"))
        reason = "Disputed payment";

      return {
        id: inv.id,
        status: inv.status,
        reason,
        userId: scope === "safeguarding" ? undefined : inv.userId,
        href: `/admin/billing/invoices/${inv.id}`,
      };
    }),
    total: flagged.length,
    scope,
  };
}

export async function listComplianceTasks(
  actor: CurrentUser,
  query: AdminListQuery
) {
  const soon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const where = {
    status: { not: "closed" },
    OR: [{ dueAt: null }, { dueAt: { lte: soon } }],
    ...(query.q
      ? { title: { contains: query.q, mode: "insensitive" as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.complianceTask.findMany({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.complianceTask.count({ where }),
  ]);

  return {
    items: rows.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueAt: t.dueAt?.toISOString() ?? null,
      href: `/admin/compliance`,
    })),
    total,
  };
}

export async function listAgentRuns(actor: CurrentUser, query: AdminListQuery) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [transformAudits, aiRuns, fairnessChecks, matchRuns, persistedRuns] =
    await Promise.all([
    prisma.auditEvent.findMany({
      where: {
        action: "care_support_transform.completed",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.aiMatchRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        fairnessChecks: { where: { status: "review_required" }, take: 1 },
        candidates: {
          take: 1,
          include: {
            explanations: { where: { audience: "admin" }, take: 1 },
          },
        },
      },
    }),
    prisma.fairnessCheck.findMany({
      where: { status: "review_required" },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.matchRun.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.agentRun.findMany({
      where: query.atRiskOnly
        ? {
            humanReviewRequired: true,
            status: { in: ["started", "completed", "blocked"] },
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const items: Array<{
    id: string;
    kind: "care_transform" | "ai_match" | "fairness" | "match_run";
    title: string;
    status: string;
    needsReview: boolean;
    plainLanguageReason?: string;
    technicalDetail?: string;
    aiGenerated: boolean;
    href?: string;
  }> = [];

  for (const ev of transformAudits) {
    const meta = (ev.metadata ?? {}) as Record<string, unknown>;
    const triggers = meta.guardrailTriggers;
    const needsReview =
      meta.humanReviewRequired === true ||
      (Array.isArray(triggers) && triggers.length > 0);
    items.push({
      id: ev.id,
      kind: "care_transform",
      title: "Care support transform",
      status: needsReview ? "review_required" : "completed",
      needsReview,
      plainLanguageReason:
        typeof meta.participantFacingSummary === "string"
          ? meta.participantFacingSummary
          : "Transformer output available for review.",
      technicalDetail:
        Array.isArray(triggers) && triggers.length > 0
          ? `Guardrails: ${triggers.join(", ")}`
          : undefined,
      aiGenerated: true,
      href: meta.careRequestId
        ? `/admin/care/requests/${String(meta.careRequestId)}`
        : "/admin/audit-events",
    });
  }

  for (const run of aiRuns) {
    const expl = run.candidates[0]?.explanations[0];
    const needsReview =
      run.fairnessChecks.length > 0 ||
      run.status === "draft" ||
      run.status === "fairness_review_required";
    items.push({
      id: run.id,
      kind: "ai_match",
      title: "AI match run",
      status: run.status,
      needsReview,
      plainLanguageReason: expl?.plainLanguage,
      technicalDetail: expl?.technicalDetail ?? undefined,
      aiGenerated: true,
      href: "/admin/ai-matching",
    });
  }

  for (const fc of fairnessChecks) {
    items.push({
      id: fc.id,
      kind: "fairness",
      title: "Fairness check",
      status: fc.status,
      needsReview: true,
      plainLanguageReason: fc.summary,
      aiGenerated: true,
      href: "/admin/fairness",
    });
  }

  for (const mr of matchRuns) {
    items.push({
      id: mr.id,
      kind: "match_run",
      title: `Match run (${mr.matchType})`,
      status: mr.status,
      needsReview: true,
      plainLanguageReason: "Pending match decision.",
      aiGenerated: false,
      href: "/admin/matching",
    });
  }

  for (const ar of persistedRuns) {
    items.push({
      id: ar.id,
      kind: "care_transform",
      title: `Agent run (${ar.agentType})`,
      status: ar.status,
      needsReview: ar.humanReviewRequired,
      plainLanguageReason: ar.humanReviewRequired
        ? "Human review required before downstream actions."
        : undefined,
      technicalDetail: `Risk tier: ${ar.riskTier}`,
      aiGenerated: true,
      href: "/admin/ops/agent-runs",
    });
  }

  const filtered = query.atRiskOnly
    ? items.filter((i) => i.needsReview)
    : items;

  return {
    items: filtered.slice(query.offset, query.offset + query.limit),
    total: filtered.length,
  };
}

export function actorHasAdminPermission(
  actor: CurrentUser,
  permission: Permission
): boolean {
  return hasPermission(actor.primaryRole, permission);
}
