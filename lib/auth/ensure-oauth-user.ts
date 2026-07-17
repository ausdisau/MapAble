import { randomBytes } from "node:crypto";

import type { MapAbleUserRole, User } from "@prisma/client";
import { hash } from "bcryptjs";

import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import { prisma } from "@/lib/prisma";

/** Unusable password for OAuth-only accounts (set password via reset to enable credentials). */
async function oauthOnlyPasswordHash(): Promise<string> {
  return hash(randomBytes(32).toString("hex"), 10);
}

export type EnsureOAuthUserInput = {
  email: string;
  name?: string | null;
  defaultRole?: MapAbleUserRole;
};

/**
 * Find an existing user by email or create a participant with role/profile rows.
 * Used on Google / Microsoft / Facebook sign-in so JWT sessions use the Prisma user id.
 */
export async function ensureOAuthUser(
  input: EnsureOAuthUserInput
): Promise<User> {
  const email = normalizeAuthEmail(input.email);
  const name =
    input.name?.trim() ||
    email.split("@")[0]?.replace(/[._]/g, " ") ||
    "MapAble User";
  const role = input.defaultRole ?? "participant";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.name !== name && name.length > 0) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { name },
      });
    }
    return existing;
  }

  const passwordHash = await oauthOnlyPasswordHash();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      primaryRole: role,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: user.id,
      role,
      isPrimary: true,
    },
  });

  if (role === "participant") {
    const displayName = name;
    await prisma.participantProfile.create({
      data: {
        userId: user.id,
        displayName,
        preferredName: displayName.split(" ")[0] ?? displayName,
      },
    });
    await prisma.accessibilityProfile.create({
      data: { userId: user.id },
    });
  }

  return user;
}
