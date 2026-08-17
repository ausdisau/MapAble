/**
 * Calls authOptions credentials authorize() directly — writes to debug-b842da.log
 * Usage: pnpm exec tsx scripts/debug-auth-authorize.ts <email> <password>
 */
import Credentials from "next-auth/providers/credentials";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { agentLog } from "@/lib/debug/agent-log";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error(
      "Usage: pnpm exec tsx scripts/debug-auth-authorize.ts <email> <password>"
    );
    process.exit(1);
  }

  agentLog("A", "debug-auth-authorize:start", "authorize probe start", {
    email,
  });

  const provider = authOptions.providers.find(
    (p): p is ReturnType<typeof Credentials> =>
      typeof p === "object" &&
      p !== null &&
      "id" in p &&
      p.id === "credentials"
  );

  const authorize =
    provider &&
    "options" in provider &&
    provider.options &&
    typeof provider.options === "object" &&
    "authorize" in provider.options &&
    typeof provider.options.authorize === "function"
      ? (provider.options.authorize as (credentials: {
          email: string;
          password: string;
        }) => Promise<{ id: string; email: string | null; name: string | null } | null>)
      : null;

  if (!authorize) {
    agentLog("A", "debug-auth-authorize:noProvider", "credentials provider missing");
    console.error("Credentials provider not found or has no authorize()");
    process.exit(1);
  }

  try {
    const result = await authorize({ email, password });

    if (!result) {
      agentLog("A", "debug-auth-authorize:denied", "authorize returned null", {
        email,
      });
      console.error("authorize() returned null — login would fail");
      process.exit(1);
    }

    agentLog("A", "debug-auth-authorize:ok", "authorize succeeded", {
      userId: result.id,
      email: result.email,
    });
    console.log("OK — authorize succeeded:", {
      id: result.id,
      email: result.email,
      name: result.name,
    });
  } catch (err) {
    agentLog("E", "debug-auth-authorize:error", "authorize threw", {
      message: err instanceof Error ? err.message : String(err),
    });
    console.error(err);
    process.exit(1);
  }
}

main();
