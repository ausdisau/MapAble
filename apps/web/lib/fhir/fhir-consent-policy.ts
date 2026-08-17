import { prisma } from "@/lib/prisma";

export async function hasFhirConsent(
  participantId: string,
  purpose: string
): Promise<boolean> {
  const record = await prisma.fhirConsentRecord.findFirst({
    where: {
      participantId,
      purpose,
      granted: true,
      revokedAt: null,
    },
  });
  return Boolean(record);
}
