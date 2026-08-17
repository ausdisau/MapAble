import type { TrustSafetyQueueSource, TrustSafetyQueueStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function syncTrustSafetyQueue() {
  const [incidents, complaints, disputedLogs] = await Promise.all([
    prisma.incidentReport.findMany({
      where: {
        safeguardingConcern: true,
        status: { notIn: ["resolved", "closed"] },
      },
      select: {
        id: true,
        title: true,
        participantId: true,
        organisationId: true,
        status: true,
      },
      take: 100,
    }),
    prisma.complaint.findMany({
      where: { status: { in: ["open", "acknowledged", "investigating", "escalated"] } },
      take: 100,
    }),
    prisma.careServiceLog.count({
      where: { status: "disputed" },
    }),
  ]);

  for (const inc of incidents) {
    await prisma.trustSafetyQueueItem.upsert({
      where: {
        id: `incident-${inc.id}`,
      },
      create: {
        id: `incident-${inc.id}`,
        source: "incident",
        status: mapIncidentStatus(inc.status),
        title: inc.title,
        summary: "Safeguarding incident",
        participantId: inc.participantId ?? undefined,
        organisationId: inc.organisationId ?? undefined,
        incidentId: inc.id,
      },
      update: {
        status: mapIncidentStatus(inc.status),
        title: inc.title,
      },
    });
  }

  for (const c of complaints) {
    const itemId = `complaint-${c.id}`;
    await prisma.trustSafetyQueueItem.upsert({
      where: { id: itemId },
      create: {
        id: itemId,
        source: "complaint",
        status: c.status,
        title: c.title,
        summary: c.description.slice(0, 200),
        participantId: c.participantId ?? undefined,
        organisationId: c.organisationId ?? undefined,
        complaintId: c.id,
        escalationLevel: c.escalationLevel,
      },
      update: {
        status: c.status,
        escalationLevel: c.escalationLevel,
      },
    });
  }

  if (disputedLogs > 0) {
    await prisma.trustSafetyQueueItem.upsert({
      where: { id: "disputed-service-logs" },
      create: {
        id: "disputed-service-logs",
        source: "disputed_service_log",
        status: "open",
        title: "Disputed service logs",
        summary: `${disputedLogs} service log(s) marked disputed`,
      },
      update: {
        summary: `${disputedLogs} service log(s) marked disputed`,
      },
    });
  }

  return listTrustSafetyQueue();
}

function mapIncidentStatus(
  status: string
): TrustSafetyQueueStatus {
  if (status === "resolved" || status === "closed") return "resolved";
  if (status === "under_review") return "investigating";
  return "open";
}

export async function listTrustSafetyQueue(filters?: {
  status?: TrustSafetyQueueStatus;
  source?: TrustSafetyQueueSource;
}) {
  return prisma.trustSafetyQueueItem.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
    },
    orderBy: [{ escalationLevel: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });
}

export async function countOpenComplaints() {
  return prisma.complaint.count({
    where: { status: { in: ["open", "acknowledged", "investigating", "escalated"] } },
  });
}

export async function createComplaint(params: {
  reportedById: string;
  title: string;
  description: string;
  participantId?: string;
  organisationId?: string;
}) {
  const complaint = await prisma.complaint.create({
    data: {
      reportedById: params.reportedById,
      title: params.title,
      description: params.description,
      participantId: params.participantId,
      organisationId: params.organisationId,
      status: "open",
    },
  });

  await prisma.trustSafetyQueueItem.create({
    data: {
      id: `complaint-${complaint.id}`,
      source: "complaint",
      status: "open",
      title: complaint.title,
      summary: complaint.description.slice(0, 200),
      participantId: params.participantId,
      organisationId: params.organisationId,
      complaintId: complaint.id,
    },
  });

  return complaint;
}
