import type { Prisma } from "@prisma/client";

import { isUnderstandingEnabled } from "@/lib/config/understanding";
import { runInTransaction } from "@/lib/db/transaction-service";
import { prisma } from "@/lib/prisma";
import { listInformalSupports } from "@/lib/understanding/informal-support-service";
import type {
  ParticipantKnowledgeGraph,
  UnderstandingEntityType,
  UnderstandingGraphNode,
} from "@/lib/understanding/types";

function assertEnabled(): void {
  if (!isUnderstandingEnabled()) {
    throw new Error("UNDERSTANDING_DISABLED");
  }
}

function parseRoutines(routinesJson: unknown): Array<{ id: string; label: string }> {
  if (!Array.isArray(routinesJson)) return [];
  return routinesJson.map((item, index) => {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const id =
        typeof rec.id === "string"
          ? rec.id
          : `routine-${index}`;
      const label =
        typeof rec.label === "string"
          ? rec.label
          : typeof rec.name === "string"
            ? rec.name
            : typeof rec.title === "string"
              ? rec.title
              : `Routine ${index + 1}`;
      return { id, label };
    }
    return { id: `routine-${index}`, label: String(item) };
  });
}

export async function ensureUnderstandingContext(input: {
  participantId: string;
  key: string;
  label: string;
  notes?: string | null;
}) {
  assertEnabled();
  return runInTransaction(async (tx) => {
    return tx.understandingContext.upsert({
      where: {
        participantId_key: {
          participantId: input.participantId,
          key: input.key,
        },
      },
      create: {
        participantId: input.participantId,
        key: input.key,
        label: input.label,
        notes: input.notes ?? null,
      },
      update: {
        label: input.label,
        notes: input.notes ?? null,
      },
    });
  });
}

export async function linkGraphEntities(input: {
  participantId: string;
  sourceType: UnderstandingEntityType;
  sourceId: string;
  targetType: UnderstandingEntityType;
  targetId: string;
  relationship: string;
  metadataJson?: Record<string, unknown>;
}) {
  assertEnabled();
  return runInTransaction(async (tx) => {
    return tx.understandingGraphEdge.upsert({
      where: {
        participantId_sourceType_sourceId_targetType_targetId_relationship: {
          participantId: input.participantId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          targetType: input.targetType,
          targetId: input.targetId,
          relationship: input.relationship,
        },
      },
      create: {
        participantId: input.participantId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        targetType: input.targetType,
        targetId: input.targetId,
        relationship: input.relationship,
        metadataJson: (input.metadataJson ?? {}) as Prisma.InputJsonValue,
      },
      update: {
        metadataJson: (input.metadataJson ?? {}) as Prisma.InputJsonValue,
      },
    });
  });
}

export async function buildParticipantKnowledgeGraph(
  participantId: string,
): Promise<ParticipantKnowledgeGraph> {
  assertEnabled();

  const [goals, profile, events, contexts, edges, informal] = await Promise.all([
    prisma.participationGoal.findMany({
      where: { participantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.supportProfile.findUnique({ where: { participantId } }),
    prisma.calendarEvent.findMany({
      where: { participantId },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
    prisma.understandingContext.findMany({
      where: { participantId },
      orderBy: { key: "asc" },
    }),
    prisma.understandingGraphEdge.findMany({
      where: { participantId },
    }),
    listInformalSupports(participantId),
  ]);

  const nodes: UnderstandingGraphNode[] = [];

  for (const g of goals) {
    nodes.push({
      id: `goal:${g.id}`,
      entityType: "goal",
      entityId: g.id,
      label: g.title,
      sourceClassification: "canonical_record",
    });
  }

  for (const r of parseRoutines(profile?.routinesJson)) {
    nodes.push({
      id: `routine:${r.id}`,
      entityType: "routine",
      entityId: r.id,
      label: r.label,
      sourceClassification: "projection",
    });
  }

  for (const e of events) {
    nodes.push({
      id: `event:${e.id}`,
      entityType: "event",
      entityId: e.id,
      label: e.title,
      sourceClassification: "canonical_record",
    });
  }

  for (const c of contexts) {
    nodes.push({
      id: `context:${c.id}`,
      entityType: "context",
      entityId: c.id,
      label: c.label,
      sourceClassification: "canonical_record",
    });
  }

  for (const s of informal) {
    nodes.push({
      id: `informal_support:${s.id}`,
      entityType: "informal_support",
      entityId: s.id,
      label: s.supporterDisplayName,
      sourceClassification: "participant_report",
    });
  }

  return {
    participantId,
    nodes,
    edges: edges.map((e) => ({
      id: e.id,
      sourceType: e.sourceType as UnderstandingEntityType,
      sourceId: e.sourceId,
      targetType: e.targetType as UnderstandingEntityType,
      targetId: e.targetId,
      relationship: e.relationship,
    })),
    builtAtIso: new Date().toISOString(),
    productionClaim: "none",
  };
}
