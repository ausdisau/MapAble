import type { ApiClientEnvironment } from "@prisma/client";

import { sandboxDataGuard } from "@/lib/partner-sandbox/sandbox-service";

export function assertSandboxSafe(
  environment: ApiClientEnvironment,
  entityLabel: string,
) {
  if (environment === "sandbox") {
    sandboxDataGuard(entityLabel);
  }
}

export function syntheticParticipantStub(id: string) {
  return {
    id,
    displayName: "Sandbox Participant",
    synthetic: true,
  };
}
