import { Prisma } from "@prisma/client";

import { careOSFeatureFlags } from "../config/feature-flags";
import { prisma } from "@/lib/prisma";
import { lifeTwinPreferencesSchema, type LifeTwinPreferences } from "./types";

const DEFAULT_PREFERENCES: LifeTwinPreferences = {
  communication: [],
  accessibility: [],
  mobilityEquipment: [],
  support: [],
  worker: [],
  culturalAndLanguage: [],
  routines: [],
  meaningfulGoals: [],
  trustedCircle: [],
  delegatedAuthorities: [],
  contingency: [],
  rememberedCareOSPreferences: [],
};

export async function getLifeTwin(participantId: string) {
  const twin = await prisma.participantLifeTwin.findFirst({
    where: { participantId, deletedAt: null },
    include: { memories: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } } },
  });
  if (!twin) return { preferences: DEFAULT_PREFERENCES, memories: [], version: 0 };
  return {
    ...twin,
    preferences: lifeTwinPreferencesSchema.parse(twin.preferences),
  };
}

export async function updateLifeTwin(
  participantId: string,
  preferences: LifeTwinPreferences
) {
  const parsed = lifeTwinPreferencesSchema.parse(preferences);
  return prisma.participantLifeTwin.upsert({
    where: { participantId },
    create: {
      participantId,
      preferences: parsed as Prisma.InputJsonValue,
    },
    update: {
      preferences: parsed as Prisma.InputJsonValue,
      version: { increment: 1 },
      deletedAt: null,
    },
  });
}

export async function rememberPreference(params: {
  participantId: string;
  key: string;
  value: unknown;
  consentScope?: string;
}) {
  if (!careOSFeatureFlags.memoryEnabled) throw new Error("FEATURE_DISABLED");
  const twin = await prisma.participantLifeTwin.upsert({
    where: { participantId: params.participantId },
    create: { participantId: params.participantId, preferences: DEFAULT_PREFERENCES },
    update: { deletedAt: null },
  });
  return prisma.participantPreferenceMemory.upsert({
    where: { lifeTwinId_key: { lifeTwinId: twin.id, key: params.key } },
    create: {
      lifeTwinId: twin.id,
      participantId: params.participantId,
      key: params.key,
      value: params.value as Prisma.InputJsonValue,
      source: "participant_confirmed",
      verifiedAt: new Date(),
      consentScope: params.consentScope,
    },
    update: {
      value: params.value as Prisma.InputJsonValue,
      source: "participant_confirmed",
      verifiedAt: new Date(),
      consentScope: params.consentScope,
      deletedAt: null,
    },
  });
}

export async function deleteOptionalMemory(participantId: string, memoryId: string) {
  return prisma.participantPreferenceMemory.updateMany({
    where: { id: memoryId, participantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
