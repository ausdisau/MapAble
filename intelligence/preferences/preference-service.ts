import { randomUUID } from "node:crypto";

import { z } from "zod";

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
  return prisma.$queryRaw<CareOSPreference[]>`
    SELECT "id", "participantId", "preferenceKey", "valueJson", "source",
           "status", "confirmedAt", "expiresAt", "createdAt", "updatedAt"
    FROM "careos_participant_preferences"
    WHERE "participantId" = ${participantId}
      AND "status" = 'active'
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    ORDER BY "preferenceKey" ASC
  `;
}

export async function upsertCareOSPreference(params: {
  participantId: string;
  key: z.infer<typeof careOSPreferenceKeySchema>;
  value: z.infer<typeof careOSPreferenceValueSchema>;
  expiresAt?: string | null;
}): Promise<void> {
  const id = randomUUID();
  const valueJson = JSON.stringify(params.value);
  const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
  await prisma.$executeRaw`
    INSERT INTO "careos_participant_preferences" (
      "id", "participantId", "preferenceKey", "valueJson", "source",
      "status", "confirmedAt", "expiresAt", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${params.participantId}, ${params.key}, CAST(${valueJson} AS JSONB),
      'participant_confirmed', 'active', NOW(), ${expiresAt}, NOW(), NOW()
    )
    ON CONFLICT ("participantId", "preferenceKey") DO UPDATE SET
      "valueJson" = EXCLUDED."valueJson",
      "source" = 'participant_confirmed',
      "status" = 'active',
      "confirmedAt" = NOW(),
      "expiresAt" = EXCLUDED."expiresAt",
      "updatedAt" = NOW()
  `;
}

export async function revokeCareOSPreference(params: {
  participantId: string;
  key: z.infer<typeof careOSPreferenceKeySchema>;
}): Promise<boolean> {
  const changed = await prisma.$executeRaw`
    UPDATE "careos_participant_preferences"
    SET "status" = 'revoked', "updatedAt" = NOW()
    WHERE "participantId" = ${params.participantId}
      AND "preferenceKey" = ${params.key}
      AND "status" = 'active'
  `;
  return changed === 1;
}
