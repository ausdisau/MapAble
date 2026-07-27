import {
  Prisma,
  type AuraHarnessMemoryDecision,
} from "@prisma/client";

import { auraHarnessConfig } from "@/lib/aura-harness/config";
import { fingerprintToolCall } from "@/lib/aura-harness/fingerprint";
import type {
  AuraRiskProfile,
  MemoryDecision,
  MitigationStrategy,
} from "@/lib/aura-harness/types";
import { prisma } from "@/lib/prisma";

export type MemoryMatch = {
  fingerprint: string;
  toolName: string;
  decision: MemoryDecision;
  normalizedGamma: number;
  concentrationCoeff: number;
  mitigation: MitigationStrategy | null;
  isSafe: boolean;
  isDangerous: boolean;
  isExpired: () => boolean;
};

type MemoryRow = {
  fingerprint: string;
  toolName: string;
  decision: MemoryDecision;
  normalizedGamma: number;
  concentrationCoeff: number;
  mitigationJson: MitigationStrategy | null;
  expiresAt: Date;
};

/** Process-local fallback used in tests or when DB is unavailable. */
const localMemory = new Map<string, MemoryRow>();

function dbAvailable(): boolean {
  // Vitest workers share a CI DATABASE_URL; keep unit-test memory process-local.
  if (process.env.VITEST === "true") return false;
  return Boolean(process.env.DATABASE_URL);
}

function ttlDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + auraHarnessConfig.memoryTtlDays);
  return d;
}

function rowToMatch(row: MemoryRow): MemoryMatch {
  const expired = () => row.expiresAt.getTime() <= Date.now();
  const isSafe =
    row.decision === "APPROVED" ||
    row.decision === "MITIGATED" ||
    row.decision === "HITL_APPROVED";
  const isDangerous =
    row.decision === "DENIED" || row.decision === "HITL_REJECTED";
  return {
    fingerprint: row.fingerprint,
    toolName: row.toolName,
    decision: row.decision,
    normalizedGamma: row.normalizedGamma,
    concentrationCoeff: row.concentrationCoeff,
    mitigation: row.mitigationJson,
    isSafe,
    isDangerous,
    isExpired: expired,
  };
}

export class VectorMemoryStore {
  async querySimilarAction(
    toolName: string,
    payload: unknown,
  ): Promise<MemoryMatch | null> {
    const fingerprint = fingerprintToolCall(toolName, payload);
    const local = localMemory.get(fingerprint);
    if (local && local.expiresAt.getTime() > Date.now()) {
      return rowToMatch(local);
    }

    if (!dbAvailable()) return null;

    try {
      const row = await prisma.auraHarnessMemory.findUnique({
        where: { fingerprint },
      });
      if (!row) return null;
      if (row.expiresAt.getTime() <= Date.now()) {
        await prisma.auraHarnessMemory
          .delete({ where: { fingerprint } })
          .catch(() => undefined);
        return null;
      }
      const match = rowToMatch({
        fingerprint: row.fingerprint,
        toolName: row.toolName,
        decision: row.decision,
        normalizedGamma: row.normalizedGamma,
        concentrationCoeff: row.concentrationCoeff,
        mitigationJson: (row.mitigationJson as MitigationStrategy | null) ?? null,
        expiresAt: row.expiresAt,
      });
      localMemory.set(fingerprint, {
        fingerprint: row.fingerprint,
        toolName: row.toolName,
        decision: row.decision,
        normalizedGamma: row.normalizedGamma,
        concentrationCoeff: row.concentrationCoeff,
        mitigationJson: match.mitigation,
        expiresAt: row.expiresAt,
      });
      return match;
    } catch {
      return local ? rowToMatch(local) : null;
    }
  }

  async findMitigation(toolName: string): Promise<MitigationStrategy | null> {
    const local = [...localMemory.values()].find(
      (row) =>
        row.toolName === toolName &&
        row.mitigationJson &&
        row.expiresAt.getTime() > Date.now() &&
        (row.decision === "MITIGATED" || row.decision === "HITL_APPROVED"),
    );
    if (local?.mitigationJson) return local.mitigationJson;
    if (!dbAvailable()) return null;

    try {
      const row = await prisma.auraHarnessMemory.findFirst({
        where: {
          toolName,
          expiresAt: { gt: new Date() },
          decision: { in: ["MITIGATED", "HITL_APPROVED"] },
          NOT: { mitigationJson: { equals: Prisma.DbNull } },
        },
        orderBy: { updatedAt: "desc" },
      });
      return (row?.mitigationJson as MitigationStrategy | null) ?? null;
    } catch {
      return null;
    }
  }

  async commitAction(
    toolName: string,
    payload: unknown,
    profile: AuraRiskProfile,
    mitigation: MitigationStrategy | null,
    decision: MemoryDecision,
    dimensionScores?: unknown,
  ): Promise<string> {
    const fingerprint = fingerprintToolCall(toolName, payload);
    const expiresAt = ttlDate();
    const row: MemoryRow = {
      fingerprint,
      toolName,
      decision,
      normalizedGamma: profile.normalizedGamma,
      concentrationCoeff: profile.concentrationCoeff,
      mitigationJson: mitigation,
      expiresAt,
    };
    localMemory.set(fingerprint, row);

    if (dbAvailable()) {
      try {
        await prisma.auraHarnessMemory.upsert({
          where: { fingerprint },
          create: {
            fingerprint,
            toolName,
            normalizedGamma: profile.normalizedGamma,
            concentrationCoeff: profile.concentrationCoeff,
            decision: decision as AuraHarnessMemoryDecision,
            mitigationJson: (mitigation ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            dimensionScores: (dimensionScores ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            expiresAt,
          },
          update: {
            toolName,
            normalizedGamma: profile.normalizedGamma,
            concentrationCoeff: profile.concentrationCoeff,
            decision: decision as AuraHarnessMemoryDecision,
            mitigationJson: (mitigation ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            dimensionScores: (dimensionScores ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            expiresAt,
          },
        });
      } catch {
        // Local cache remains authoritative when DB is unavailable.
      }
    }

    return fingerprint;
  }
}

export const vectorMemoryStore = new VectorMemoryStore();

/** Test helper — clears process-local memory cache. */
export function __resetAuraMemoryForTests(): void {
  localMemory.clear();
}
