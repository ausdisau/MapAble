import { assertCanAccessBillingOrganisation } from "@/lib/billing/access";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isProviderOpsEnabled } from "@/lib/config/provider-ops";
import type {
  AttentionItem,
  AttentionQueue,
} from "@/lib/provider-ops/types";
import { prisma } from "@/lib/prisma";

export class ProviderOpsError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProviderOpsError";
    this.status = status;
  }
}

function participantRef(id: string): string {
  return `participant:${id.slice(0, 6)}…`;
}

/**
 * Read-only attention projection. Writers remain in Care, Transport, Billing, etc.
 */
export async function buildProviderAttentionQueue(input: {
  user: CurrentUser;
  organisationId: string;
}): Promise<AttentionQueue> {
  if (!isProviderOpsEnabled()) {
    throw new ProviderOpsError("Provider Operations is not enabled", 503);
  }

  await assertCanAccessBillingOrganisation(input.user, input.organisationId);

  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 3600_000);
  const items: AttentionItem[] = [];

  const unfilledShifts = await prisma.careShift.findMany({
    where: {
      organisationId: input.organisationId,
      workerProfileId: null,
      startAt: { gte: now, lte: in72h },
      status: { in: ["scheduled", "confirmed"] },
    },
    select: {
      id: true,
      participantId: true,
      startAt: true,
      status: true,
    },
    take: 25,
  });

  for (const shift of unfilledShifts) {
    items.push({
      id: `shift_unfilled_${shift.id}`,
      kind: "essential_shift_unfilled",
      title: "Essential shift unfilled",
      why: `Shift starting ${shift.startAt.toISOString()} has no assigned worker`,
      ownerLabel: "Care roster lead",
      deepLink: `/care/shifts/${shift.id}`,
      organisationId: input.organisationId,
      deadlineAt: shift.startAt.toISOString(),
      severity: "critical",
      participantRef: participantRef(shift.participantId),
      unresolvedConsequence:
        "Support may not be delivered; Continuity recovery may be required",
    });
  }

  const expiringWorkers = await prisma.workerProfile.findMany({
    where: {
      organisationId: input.organisationId,
      active: true,
      OR: [
        { workerScreeningStatus: "expired" },
        { wwccStatus: "expired" },
        { firstAidStatus: "expired" },
        { insuranceStatus: "expired" },
      ],
    },
    select: {
      id: true,
      displayName: true,
      workerScreeningStatus: true,
      wwccStatus: true,
    },
    take: 25,
  });

  for (const worker of expiringWorkers) {
    items.push({
      id: `cred_${worker.id}`,
      kind: "worker_credential_expiring",
      title: "Worker credential expired",
      why: `Screening=${worker.workerScreeningStatus}, WWCC=${worker.wwccStatus}`,
      ownerLabel: "Workforce compliance",
      deepLink: `/workers/${worker.id}`,
      organisationId: input.organisationId,
      severity: "high",
      unresolvedConsequence:
        "Worker readiness will remain blocked; assignment must stay human-reviewed",
    });
  }

  const riskyTrips = await prisma.transportTrip.findMany({
    where: {
      providerOrganisationId: input.organisationId,
      status: {
        in: [
          "requested",
          "provider_review",
          "dispatch_pending",
          "declined",
          "driver_no_show",
        ],
      },
      scheduledStart: { gte: now, lte: in72h },
    },
    select: {
      id: true,
      participantId: true,
      status: true,
      scheduledStart: true,
    },
    take: 25,
  });

  for (const trip of riskyTrips) {
    items.push({
      id: `trip_${trip.id}`,
      kind: "transport_at_risk",
      title: "Transport at risk",
      why: `Trip status ${trip.status} before pickup`,
      ownerLabel: "Transport dispatch",
      deepLink: `/transport/trips/${trip.id}`,
      organisationId: input.organisationId,
      deadlineAt: trip.scheduledStart.toISOString(),
      severity: "high",
      participantRef: participantRef(trip.participantId),
      unresolvedConsequence:
        "Participant may miss employment or care arrival; open Continuity case",
    });
  }

  const rejectedInvoices = await prisma.billingInvoice.findMany({
    where: {
      providerId: input.organisationId,
      status: { in: ["disputed", "void", "failed", "on_hold"] },
    },
    select: { id: true, status: true, userId: true, updatedAt: true },
    take: 25,
  });

  for (const invoice of rejectedInvoices) {
    items.push({
      id: `inv_${invoice.id}`,
      kind: "rejected_invoice",
      title: "Rejected or disputed invoice",
      why: `Invoice status ${invoice.status}`,
      ownerLabel: "Billing officer",
      deepLink: `/billing/invoices/${invoice.id}`,
      organisationId: input.organisationId,
      severity: "high",
      participantRef: participantRef(invoice.userId),
      unresolvedConsequence: "Provider payable remains unreconciled",
    });
  }

  const openIncidents = await prisma.incidentReport.findMany({
    where: {
      organisationId: input.organisationId,
      status: {
        in: ["submitted", "triage", "under_review", "escalated"],
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      participantId: true,
    },
    take: 25,
  });

  for (const incident of openIncidents) {
    const deadline = new Date(incident.createdAt.getTime() + 7 * 86400_000);
    items.push({
      id: `inc_${incident.id}`,
      kind: "incident_deadline",
      title: "Incident deadline approaching",
      why: `Incident still ${incident.status}`,
      ownerLabel: "Quality & Safeguards",
      deepLink: `/incidents/${incident.id}`,
      organisationId: input.organisationId,
      deadlineAt: deadline.toISOString(),
      severity: deadline.getTime() < in72h.getTime() ? "critical" : "medium",
      participantRef: incident.participantId
        ? participantRef(incident.participantId)
        : undefined,
      unresolvedConsequence: "Regulatory reporting window may be missed",
    });
  }

  const unacked = await prisma.auditEvent.findMany({
    where: {
      organisationId: input.organisationId,
      action: "communication_passport.updated",
      createdAt: { gte: new Date(now.getTime() - 14 * 86400_000) },
    },
    select: { id: true, participantId: true, createdAt: true },
    take: 25,
  });

  for (const event of unacked) {
    if (!event.participantId) continue;
    const ack = await prisma.auditEvent.findFirst({
      where: {
        action: "communication_passport.acknowledged",
        participantId: event.participantId,
        organisationId: input.organisationId,
        createdAt: { gte: event.createdAt },
      },
      select: { id: true },
    });
    if (ack) continue;
    items.push({
      id: `passport_unacked_${event.id}`,
      kind: "communication_requirement_unacked",
      title: "Communication requirement not acknowledged",
      why: "Passport updated without worker acknowledgement in this organisation",
      ownerLabel: "Assigned worker / coordinator",
      deepLink: `/communication-passport`,
      organisationId: input.organisationId,
      severity: "medium",
      participantRef: participantRef(event.participantId),
      unresolvedConsequence:
        "Worker readiness remains blocked for AAC / communication-sensitive supports",
    });
  }

  items.sort((a, b) => {
    const rank = { critical: 0, high: 1, medium: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return {
    organisationId: input.organisationId,
    generatedAt: now.toISOString(),
    items,
    readOnly: true,
  };
}
