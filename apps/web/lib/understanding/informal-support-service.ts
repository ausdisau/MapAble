import { isUnderstandingEnabled } from "@/lib/config/understanding";
import { runInTransaction } from "@/lib/db/transaction-service";
import { prisma } from "@/lib/prisma";
import type {
  InformalSupportView,
  StabilityTrend,
} from "@/lib/understanding/types";

function assertEnabled(): void {
  if (!isUnderstandingEnabled()) {
    throw new Error("UNDERSTANDING_DISABLED");
  }
}

function toView(row: {
  id: string;
  participantId: string;
  supporterDisplayName: string;
  supporterUserId: string | null;
  relationshipLabel: string;
  capacityScore: number;
  stabilityTrend: string;
  notes: string | null;
}): InformalSupportView {
  return {
    id: row.id,
    participantId: row.participantId,
    supporterDisplayName: row.supporterDisplayName,
    supporterUserId: row.supporterUserId,
    relationshipLabel: row.relationshipLabel,
    capacityScore: row.capacityScore,
    stabilityTrend: row.stabilityTrend as StabilityTrend,
    notes: row.notes,
  };
}

export async function listInformalSupports(
  participantId: string,
): Promise<InformalSupportView[]> {
  assertEnabled();
  const rows = await prisma.informalSupportLink.findMany({
    where: { participantId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toView);
}

export async function upsertInformalSupport(input: {
  participantId: string;
  supporterDisplayName: string;
  supporterUserId?: string | null;
  relationshipLabel: string;
  capacityScore: number;
  stabilityTrend: StabilityTrend;
  notes?: string | null;
  id?: string;
}): Promise<InformalSupportView> {
  assertEnabled();
  const capacity = Math.min(100, Math.max(0, Math.round(input.capacityScore)));

  return runInTransaction(async (tx) => {
    if (input.id) {
      const updated = await tx.informalSupportLink.update({
        where: { id: input.id },
        data: {
          supporterDisplayName: input.supporterDisplayName.trim(),
          supporterUserId: input.supporterUserId ?? null,
          relationshipLabel: input.relationshipLabel.trim(),
          capacityScore: capacity,
          stabilityTrend: input.stabilityTrend,
          notes: input.notes ?? null,
        },
      });
      return toView(updated);
    }

    const created = await tx.informalSupportLink.create({
      data: {
        participantId: input.participantId,
        supporterDisplayName: input.supporterDisplayName.trim(),
        supporterUserId: input.supporterUserId ?? null,
        relationshipLabel: input.relationshipLabel.trim(),
        capacityScore: capacity,
        stabilityTrend: input.stabilityTrend,
        notes: input.notes ?? null,
      },
    });
    return toView(created);
  });
}

export async function deleteInformalSupport(input: {
  id: string;
  participantId: string;
}): Promise<void> {
  assertEnabled();
  await runInTransaction(async (tx) => {
    const existing = await tx.informalSupportLink.findFirst({
      where: { id: input.id, participantId: input.participantId },
    });
    if (!existing) throw new Error("NOT_FOUND");
    await tx.informalSupportLink.delete({ where: { id: input.id } });
  });
}
