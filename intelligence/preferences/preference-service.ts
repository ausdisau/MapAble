import { z } from "zod";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const careOSPreferenceKeySchema = z.enum([
  "preferred_pickup_buffer_minutes",
  "preferred_contact_method",
  "preferred_response_format",
  "regular_worker_preference",
  "transport_assistance_preference",
  "venue_access_priority",
  "communication_support_preference",
]);

export const careOSPreferenceValueSchema = z.union([
  z.string().trim().min(1).max(1000),
  z.number().finite().min(0).max(1440),
  z.boolean(),
  z.array(z.string().trim().min(1).max(200)).max(20),
]);

export const upsertCareOSPreferenceSchema = z.object({
  key: careOSPreferenceKeySchema,
  value: careOSPreferenceValueSchema,
  expiresAt: z.string().datetime().nullable().optional(),
});

export type CareOSPreference = {
  id: string;
  participantId: string;
  preferenceKey: z.infer<typeof careOSPreferenceKeySchema>;
  valueJson: unknown;
  source: string;
  status: "active" | "revoked" | "expired";
  confirmedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listCareOSPreferences(
  participantId: string,
): Promise<CareOSPreference[]> {
  const rows = await prisma.careOSParticipantPreference.findMany({
    where: {
      participantId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { preferenceKey: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    participantId: row.participantId,
    preferenceKey: row.preferenceKey as CareOSPreference["preferenceKey"],
    valueJson: row.valueJson,
    source: row.source,
    status: row.status as CareOSPreference["status"],
    confirmedAt: row.confirmedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function upsertCareOSPreference(params: {
  participantId: string;
  key: z.infer<typeof careOSPreferenceKeySchema>;
  value: z.infer<typeof careOSPreferenceValueSchema>;
  expiresAt?: string | null;
}): Promise<void> {
  const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
  await prisma.careOSParticipantPreference.upsert({
    where: {
      participantId_preferenceKey: {
        participantId: params.participantId,
        preferenceKey: params.key,
      },
    },
    create: {
      participantId: params.participantId,
      preferenceKey: params.key,
      valueJson: params.value as Prisma.InputJsonValue,
      source: "participant_confirmed",
      status: "active",
      expiresAt,
    },
    update: {
      valueJson: params.value as Prisma.InputJsonValue,
      source: "participant_confirmed",
      status: "active",
      confirmedAt: new Date(),
      expiresAt,
    },
  });
}

export async function revokeCareOSPreference(params: {
  participantId: string;
  key: z.infer<typeof careOSPreferenceKeySchema>;
}): Promise<boolean> {
  const result = await prisma.careOSParticipantPreference.updateMany({
    where: {
      participantId: params.participantId,
      preferenceKey: params.key,
      status: "active",
    },
    data: { status: "revoked" },
  });
  return result.count === 1;
}
