/**
 * Deterministic CI/pilot users for authenticated Playwright accessibility.
 * Password for all seeded users: Password123!
 * Safe for disposable test databases only — never run against production.
 */
import { PrismaClient, type MapAbleUserRole } from "@prisma/client";

import { seedMapAbleCore } from "./seed-mapable-core";

const prisma = new PrismaClient();

/** bcrypt hash for `Password123!` (same as seed-mapable-core). */
const PASSWORD_HASH =
  "$2b$10$3M5Pn.9r2FhZq.zxdgVhJuX56pWpG7PUViH0931hNLOkDcOM3g/TO";

export const A11Y_PILOT_USERS = {
  participant: {
    email: "participant@mapable.test",
    password: "Password123!",
    role: "participant" as const,
  },
  provider: {
    email: "provider@mapable.test",
    password: "Password123!",
    role: "provider_admin" as const,
  },
  coordinator: {
    email: "coordinator@mapable.test",
    password: "Password123!",
    role: "support_coordinator" as const,
  },
  admin: {
    email: "admin@mapable.test",
    password: "Password123!",
    role: "mapable_admin" as const,
  },
} as const;

async function ensureUser(input: {
  name: string;
  email: string;
  primaryRole: MapAbleUserRole;
}): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    create: {
      name: input.name,
      email: input.email,
      passwordHash: PASSWORD_HASH,
      primaryRole: input.primaryRole,
      phone: "0400 000 000",
    },
    update: {
      passwordHash: PASSWORD_HASH,
      primaryRole: input.primaryRole,
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId: user.id, role: input.primaryRole } },
    create: { userId: user.id, role: input.primaryRole, isPrimary: true },
    update: { isPrimary: true },
  });
  return user.id;
}

export async function seedA11yPilot(): Promise<void> {
  await seedMapAbleCore();

  const providerId = await ensureUser({
    name: "Demo Provider Admin",
    email: A11Y_PILOT_USERS.provider.email,
    primaryRole: "provider_admin",
  });

  const careOrg = await prisma.organisation.upsert({
    where: { id: "seed-care-org" },
    create: {
      id: "seed-care-org",
      name: "Demo Care Services Pty Ltd",
      organisationType: "care_provider",
      contactEmail: "care@demo.mapable.test",
      verificationStatus: "verified",
      ndisRegistrationClaimed: true,
      serviceRegions: ["Melbourne Metro"],
    },
    update: {},
  });

  await prisma.organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: providerId,
        organisationId: careOrg.id,
      },
    },
    create: {
      userId: providerId,
      organisationId: careOrg.id,
      role: "provider_admin",
    },
    update: { role: "provider_admin" },
  });

  // Ensure coordinator/admin password hashes are always the known test password.
  await ensureUser({
    name: "Sam Coordinator",
    email: A11Y_PILOT_USERS.coordinator.email,
    primaryRole: "support_coordinator",
  });
  await ensureUser({
    name: "MapAble Admin",
    email: A11Y_PILOT_USERS.admin.email,
    primaryRole: "mapable_admin",
  });

  console.log(
    "A11y pilot seed ready:",
    Object.values(A11Y_PILOT_USERS)
      .map((u) => u.email)
      .join(", "),
  );
}

async function main(): Promise<void> {
  try {
    await seedA11yPilot();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
