import type { CareOSMission, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Canonical CareOS mission persistence.
 * All writers must use this (or Prisma against these fields) — no fabric `$executeRaw`.
 */
export type CanonicalMissionCreate = {
  participantId: string;
  requestId: string;
  missionType: string;
  desiredOutcome: string;
  status?: string;
  tenantId?: string;
  authorityDecisionId?: string;
  inputSummary?: Prisma.InputJsonValue;
  graphJson?: Prisma.InputJsonValue;
  modulesJson?: Prisma.InputJsonValue;
  alertsJson?: Prisma.InputJsonValue;
  proposalsJson?: Prisma.InputJsonValue;
  correlationId?: string;
  workflowRunId?: string;
  stateVersion?: number;
};

/** Fabric-era compatibility shape (goal/modules). */
export type FabricMissionView = {
  id: string;
  requestId: string;
  participantId: string;
  goal: string;
  status: string;
  modules: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function toFabricMissionView(mission: CareOSMission): FabricMissionView {
  const modules = Array.isArray(mission.modulesJson)
    ? (mission.modulesJson as unknown[]).filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  return {
    id: mission.id,
    requestId: mission.requestId,
    participantId: mission.participantId,
    goal: mission.desiredOutcome,
    status: mission.status,
    modules,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  };
}

export async function createCanonicalMission(input: CanonicalMissionCreate) {
  return prisma.careOSMission.create({
    data: {
      participantId: input.participantId,
      requestId: input.requestId,
      missionType: input.missionType,
      desiredOutcome: input.desiredOutcome,
      status: input.status ?? "proposed",
      tenantId: input.tenantId,
      authorityDecisionId: input.authorityDecisionId,
      inputSummary: input.inputSummary ?? {},
      graphJson: input.graphJson ?? {},
      modulesJson: input.modulesJson ?? [],
      alertsJson: input.alertsJson ?? [],
      proposalsJson: input.proposalsJson ?? [],
      correlationId: input.correlationId,
      workflowRunId: input.workflowRunId,
      stateVersion: input.stateVersion ?? 1,
    },
  });
}

export async function appendMissionEvent(input: {
  missionId: string;
  participantId: string;
  eventType: string;
  sourceModule: string;
  sourceEntityId?: string;
  severity?: string;
  summary: string;
  payloadJson?: Prisma.InputJsonValue;
  eventKey?: string;
}) {
  if (input.eventKey) {
    const existing = await prisma.careOSMissionEvent.findUnique({
      where: {
        missionId_eventKey: {
          missionId: input.missionId,
          eventKey: input.eventKey,
        },
      },
    });
    if (existing) return existing;
  }

  return prisma.careOSMissionEvent.create({
    data: {
      missionId: input.missionId,
      participantId: input.participantId,
      eventType: input.eventType,
      sourceModule: input.sourceModule,
      sourceEntityId: input.sourceEntityId,
      severity: input.severity ?? "information",
      summary: input.summary,
      payloadJson: input.payloadJson,
      eventKey: input.eventKey,
    },
  });
}

export async function bumpMissionStateVersion(missionId: string) {
  return prisma.careOSMission.update({
    where: { id: missionId },
    data: { stateVersion: { increment: 1 } },
  });
}
