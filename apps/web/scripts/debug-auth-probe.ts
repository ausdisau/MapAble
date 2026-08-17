/**
 * One-off auth flow probe — writes to debug-b842da.log
 * Usage: pnpm exec tsx scripts/debug-auth-probe.ts [email] [password]
 */
import { compare } from "bcryptjs";

import { agentLog } from "@/lib/debug/agent-log";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2] ?? "admin@mapable.test";
  const password = process.argv[3] ?? "password123";

  agentLog("A", "debug-auth-probe:start", "probe start", {
    email,
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
  });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      agentLog("A", "debug-auth-probe:noUser", "user not found", { email });
      console.error("User not found:", email);
      process.exit(1);
    }

    const valid = await compare(password, user.passwordHash);
    agentLog("A", "debug-auth-probe:compare", "password compare", {
      userId: user.id,
      valid,
      primaryRole: user.primaryRole,
    });

    if (!valid) {
      console.error("Password invalid for", email);
      process.exit(1);
    }

    agentLog("A", "debug-auth-probe:ok", "credentials would authorize", {
      userId: user.id,
    });
    console.log("OK — authorize would succeed for", email);
  } catch (err) {
    agentLog("E", "debug-auth-probe:error", "probe error", {
      message: err instanceof Error ? err.message : String(err),
    });
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
