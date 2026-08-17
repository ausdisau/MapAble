/**
 * Seed active NDIS service delivery authorizations.
 * Bootstraps a demo care org when missing (production-safe idempotent upsert).
 *
 * Run: pnpm seed:ndis-service-delivery
 * Or:  pnpm exec tsx prisma/seed-ndis-service-delivery.ts (loads ../.env automatically)
 */
import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile();

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env and configure Neon:\n" +
      "  cp .env.example .env\n" +
      "  python3 scripts/configure-neon-env.py '<neon-pooled-connection-string>'"
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function resolveParticipant() {
  return (
    (await prisma.user.findUnique({
      where: { email: "participant@mapable.test" },
    })) ??
    (await prisma.user.findFirst({
      where: { primaryRole: "participant" },
      orderBy: { createdAt: "asc" },
    }))
  );
}

async function resolveCareOrg(createdById: string) {
  const existing = await prisma.organisation.findUnique({
    where: { id: "seed-care-org" },
  });
  if (existing) return existing;

  return prisma.organisation.create({
    data: {
      id: "seed-care-org",
      name: "Demo Care Services Pty Ltd",
      organisationType: "care_provider",
      contactEmail: "care@demo.mapable.test",
      verificationStatus: "verified",
      ndisRegistrationClaimed: true,
      serviceRegions: ["Melbourne Metro"],
    },
  });
}

async function main() {
  const participant = await resolveParticipant();
  if (!participant) {
    console.warn("No participant user found — create a user first.");
    return;
  }

  const providerUser =
    (await prisma.user.findFirst({ where: { email: "provider@mapable.test" } })) ??
    participant;
  const careOrg = await resolveCareOrg(providerUser.id);

  await prisma.participantProviderRelationship.upsert({
    where: {
      participantId_providerOrgId: {
        participantId: participant.id,
        providerOrgId: careOrg.id,
      },
    },
    create: {
      participantId: participant.id,
      providerOrgId: careOrg.id,
      status: "active",
      myProviderVerifiedAt: new Date(),
      notes: "Seeded for NDIS service delivery mechanism demo.",
    },
    update: {
      status: "active",
      myProviderVerifiedAt: new Date(),
    },
  });

  const validFrom = new Date();
  validFrom.setMonth(validFrom.getMonth() - 1);
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);

  const templates = [
    {
      paymentRoute: "ndia_managed" as const,
      deliveryMechanism: "face_to_face" as const,
      authorizationType: "ndia_service_booking" as const,
      ndiaBookingReference: "DEMO-SB-001",
      supportItemCode: "01_011_0107_1_1",
    },
    {
      paymentRoute: "plan_managed" as const,
      deliveryMechanism: "telehealth" as const,
      authorizationType: "plan_manager_approval" as const,
      supportItemCode: "15_056_0128_1_3",
    },
    {
      paymentRoute: "self_managed" as const,
      deliveryMechanism: "non_face_to_face" as const,
      authorizationType: "participant_self_managed" as const,
      supportItemCode: "01_016_0104_1_1",
    },
  ];

  console.log(
    `Seeding authorizations for participant ${participant.email} + org ${careOrg.name}`
  );

  for (const t of templates) {
    const existing = await prisma.ndisServiceDeliveryAuthorization.findFirst({
      where: {
        participantId: participant.id,
        providerOrgId: careOrg.id,
        paymentRoute: t.paymentRoute,
        deliveryMechanism: t.deliveryMechanism,
        status: "active",
      },
    });
    if (existing) {
      console.log(`  keep ${t.paymentRoute}/${t.deliveryMechanism} (${existing.id})`);
      continue;
    }

    const record = await prisma.ndisServiceDeliveryAuthorization.create({
      data: {
        participantId: participant.id,
        providerOrgId: careOrg.id,
        paymentRoute: t.paymentRoute,
        deliveryMechanism: t.deliveryMechanism,
        authorizationType: t.authorizationType,
        status: "active",
        supportItemCode: t.supportItemCode,
        ndiaBookingReference: t.ndiaBookingReference,
        validFrom,
        validTo,
        notes: "Demo authorization for NDIS service delivery mechanism.",
        createdById: providerUser.id,
      },
    });
    console.log(`  created ${t.paymentRoute}/${t.deliveryMechanism} (${record.id})`);
  }

  console.log("NDIS service delivery authorization seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
