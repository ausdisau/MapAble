import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { careOSFeatureFlags } from "../config/feature-flags";

import {
  lifeTwinDomainRecordSchema,
  lifeTwinPreferencesSchema,
  type LifeTwinDomainRecordInput,
  type LifeTwinPreferences,
} from "./types";

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
    include: {
      memories: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
      domainRecords: {
        where: { deletedAt: null },
        orderBy: [{ domain: "asc" }, { version: "desc" }],
      },
    },
  });
  if (!twin) return { preferences: DEFAULT_PREFERENCES, memories: [], domainRecords: [], version: 0 };
  return {
    ...twin,
    preferences: lifeTwinPreferencesSchema.parse(twin.preferences),
  };
}

export async function listLifeTwinDomainRecords(participantId: string) {
  return prisma.lifeTwinDomainRecord.findMany({
    where: { participantId, deletedAt: null },
    orderBy: [{ domain: "asc" }, { version: "desc" }],
  });
}

export async function addLifeTwinDomainRecord(
  participantId: string,
  input: LifeTwinDomainRecordInput
) {
  const parsed = lifeTwinDomainRecordSchema.parse(input);
  if (parsed.source === "inference" && parsed.verificationStatus !== "unverified") {
    throw new Error("INFERENCE_MUST_REMAIN_UNVERIFIED");
  }
  const twin = await prisma.participantLifeTwin.upsert({
    where: { participantId },
    create: { participantId, preferences: DEFAULT_PREFERENCES },
    update: { deletedAt: null },
  });
  const latest = await prisma.lifeTwinDomainRecord.findFirst({
    where: { lifeTwinId: twin.id, domain: parsed.domain, deletedAt: null },
    orderBy: { version: "desc" },
  });
  return prisma.lifeTwinDomainRecord.create({
    data: {
      lifeTwinId: twin.id,
      participantId,
      domain: parsed.domain,
      value: parsed.value as Prisma.InputJsonValue,
      source: parsed.source,
      verificationStatus: parsed.verificationStatus,
      consentScopes: parsed.consentScopes,
      version: (latest?.version ?? 0) + 1,
      supersedesRecordId: latest?.id,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
    },
  });
}

export async function disputeLifeTwinDomainRecord(
  participantId: string,
  recordId: string
) {
  return prisma.lifeTwinDomainRecord.updateMany({
    where: { id: recordId, participantId, deletedAt: null },
    data: { verificationStatus: "disputed", disputedAt: new Date() },
  });
}

export async function removeLifeTwinDomainRecord(
  participantId: string,
  recordId: string
) {
  return prisma.lifeTwinDomainRecord.updateMany({
    where: { id: recordId, participantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
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
