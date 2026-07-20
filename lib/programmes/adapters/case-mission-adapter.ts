import type { CaseLinkType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createCorrelationId,
  emitProgrammeAuditEvent,
} from "@/lib/programmes/audit";
import type {
  CreateMissionInput,
  MissionDependencyAdapter,
  MissionDependencyNode,
  MissionView,
} from "@/lib/programmes/contracts/mission-dependency-adapter";

function mapCaseStatus(status: string): string {
  return status;
}

function mapTaskToDependency(task: {
  id: string;
  title: string;
  status: string;
  dueAt: Date | null;
}): MissionDependencyNode {
  return {
    id: task.id,
    type: "task",
    label: task.title,
    status: task.status,
    dueAt: task.dueAt,
    isUnknown: false,
  };
}

/**
 * Interim mission adapter — `CareOSMission` is **absent** on main (#252 closed unmerged).
 * Bridges `Case` until a reviewed mission SoT lands. Replace via `MissionDependencyAdapter`.
 * Programme code must not write speculative CareOSMission tables.
 */
export class CaseMissionAdapter implements MissionDependencyAdapter {
  readonly isMock = false;
  readonly interimLabel = "Case_bridge_CareOSMission_absent" as const;

  async createMission(input: CreateMissionInput): Promise<MissionView> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const reference = `CASE-${Date.now()}`;

    const caseRecord = await prisma.case.create({
      data: {
        reference,
        title: input.title,
        description: input.description ?? "",
        participantId: input.participantId,
        createdById: input.createdById,
        status: "open",
        tagsJson: { programmeFoundation: true, correlationId },
      },
      include: { tasks: true },
    });

    await emitProgrammeAuditEvent({
      programmeId: "pathways",
      correlationId,
      actorUserId: input.createdById,
      action: "mission.created",
      entityType: "Case",
      entityId: caseRecord.id,
      participantId: input.participantId,
    });

    return {
      id: caseRecord.id,
      participantId: input.participantId,
      title: caseRecord.title,
      status: mapCaseStatus(caseRecord.status),
      correlationId,
      dependencies: caseRecord.tasks.map(mapTaskToDependency),
    };
  }

  async getMission(missionId: string): Promise<MissionView | null> {
    const caseRecord = await prisma.case.findUnique({
      where: { id: missionId },
      include: { tasks: true, links: true },
    });

    if (!caseRecord) {
      return null;
    }

    const tags = (caseRecord.tagsJson ?? {}) as Record<string, unknown>;

    const linkDependencies: MissionDependencyNode[] = caseRecord.links.map(
      (link) => ({
        id: link.id,
        type: link.linkType,
        label: link.label,
        status: "linked",
        isUnknown: !link.targetId,
      }),
    );

    return {
      id: caseRecord.id,
      participantId: caseRecord.participantId ?? "",
      title: caseRecord.title,
      status: mapCaseStatus(caseRecord.status),
      correlationId: String(tags.correlationId ?? caseRecord.id),
      dependencies: [
        ...caseRecord.tasks.map(mapTaskToDependency),
        ...linkDependencies,
      ],
    };
  }

  async listMissionsForParticipant(
    participantId: string,
  ): Promise<MissionView[]> {
    const cases = await prisma.case.findMany({
      where: { participantId },
      include: { tasks: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return Promise.all(
      cases.map(async (caseRecord) => {
        const view = await this.getMission(caseRecord.id);
        return view!;
      }),
    );
  }

  async addDependency(
    missionId: string,
    dependency: Omit<MissionDependencyNode, "id">,
  ): Promise<MissionDependencyNode> {
    if (dependency.type === "task") {
      const task = await prisma.caseTask.create({
        data: {
          caseId: missionId,
          title: dependency.label,
          status: "pending",
          dueAt: dependency.dueAt ?? undefined,
          createdById: (
            await prisma.case.findUniqueOrThrow({
              where: { id: missionId },
              select: { createdById: true },
            })
          ).createdById,
        },
      });
      return mapTaskToDependency(task);
    }

    const link = await prisma.caseLink.create({
      data: {
        caseId: missionId,
        linkType: dependency.type as CaseLinkType,
        label: dependency.label,
        createdById: (
          await prisma.case.findUniqueOrThrow({
            where: { id: missionId },
            select: { createdById: true },
          })
        ).createdById,
      },
    });

    return {
      id: link.id,
      type: link.linkType,
      label: link.label,
      status: dependency.status,
      isUnknown: dependency.isUnknown,
    };
  }
}

let caseMissionAdapter: CaseMissionAdapter | null = null;

export function getCaseMissionAdapter(): CaseMissionAdapter {
  if (!caseMissionAdapter) {
    caseMissionAdapter = new CaseMissionAdapter();
  }
  return caseMissionAdapter;
}
