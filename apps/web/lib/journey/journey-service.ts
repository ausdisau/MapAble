import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import { prisma } from "@/lib/prisma";
import type { SupportJourneyPatch } from "@/server/agents/care/types";

export async function applySupportJourneyPatch(params: {
  participantId: string;
  patch: SupportJourneyPatch;
  careRequestId?: string;
  actorUserId?: string;
}) {
  if (!platformPatternsConfig.journeyPersistenceEnabled) {
    return { persisted: false };
  }

  const graphJson = {
    version: params.patch.version,
    sessionId: params.patch.sessionId,
    nodes: params.patch.nodes,
    edges: params.patch.edges,
    pendingConfirmationGate: params.patch.pendingConfirmationGate,
  };

  const session = await prisma.supportJourneySession.upsert({
    where: {
      participantId_sessionId: {
        participantId: params.participantId,
        sessionId: params.patch.sessionId,
      },
    },
    create: {
      participantId: params.participantId,
      sessionId: params.patch.sessionId,
      graphJson,
      pendingConfirmationGate: params.patch.pendingConfirmationGate,
      careRequestId: params.careRequestId,
    },
    update: {
      graphJson,
      pendingConfirmationGate: params.patch.pendingConfirmationGate,
      careRequestId: params.careRequestId ?? undefined,
      version: { increment: 1 },
    },
  });

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "support_journey.patch_applied",
      entityType: "SupportJourneySession",
      entityId: session.id,
      participantId: params.participantId,
      metadata: { sessionId: params.patch.sessionId },
    });
  }

  return { persisted: true, session };
}

export async function getSupportJourneyGraph(participantId: string) {
  const sessions = await prisma.supportJourneySession.findMany({
    where: { participantId },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
  return sessions;
}

export async function markJourneyNodeComplete(params: {
  participantId: string;
  sessionId: string;
  nodeId: string;
}) {
  const session = await prisma.supportJourneySession.findUnique({
    where: {
      participantId_sessionId: {
        participantId: params.participantId,
        sessionId: params.sessionId,
      },
    },
  });
  if (!session) return null;

  const graph = session.graphJson as {
    nodes?: { id: string; status: string }[];
    edges?: unknown[];
  };
  if (graph.nodes) {
    for (const node of graph.nodes) {
      if (node.id === params.nodeId) node.status = "complete";
    }
  }

  return prisma.supportJourneySession.update({
    where: { id: session.id },
    data: { graphJson: graph as Prisma.InputJsonValue },
  });
}
