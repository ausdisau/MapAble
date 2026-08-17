/**
 * Demo seed data for Y1 wedge features (staging only).
 * Import from prisma/seed.ts when wedge flags are enabled in environment.
 */
import { prisma } from "@/lib/prisma";
import { defaultSupportProfileSections } from "@/lib/support/profile/types";

export async function seedMapableY1Wedge(participantEmail = "participant@mapable.test") {
  const participant = await prisma.user.findUnique({
    where: { email: participantEmail },
  });
  if (!participant) {
    console.warn("[y1-wedge] participant not found, skipping");
    return;
  }

  const defaults = defaultSupportProfileSections();
  await prisma.supportProfile.upsert({
    where: { participantId: participant.id },
    create: {
      participantId: participant.id,
      routinesJson: [
        { label: "Morning routine", detail: "Breakfast around 8am, quiet start preferred" },
        ...defaults.routinesJson,
      ],
      preferencesJson: [
        { label: "Continuity", detail: "Prefer the same worker when possible" },
      ],
      boundariesJson: [
        { label: "Personal space", detail: "Knock before entering bedroom" },
      ],
      escalationJson: {
        primaryContact: "Nominee — Alex",
        whenToEscalate: "If participant distress lasts more than 15 minutes",
      },
      publishedAt: new Date(),
      version: 1,
    },
    update: {
      publishedAt: new Date(),
    },
  });

  console.log("[y1-wedge] support profile seeded for", participantEmail);
}
