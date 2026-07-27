import type { z } from "zod";

import type { CareOSAuthorityLevel } from "../policy/autonomy";
import type { CareOSContext } from "../context/careos-context";
import type { CareOSConsentScope } from "../consent/scopes";

export type CareOSToolRisk = "read" | "draft" | "write" | "restricted";

export type CareOSToolDefinition<TInput, TOutput> = {
  name: string;
  description: string;
  module: "core" | "care" | "transport" | "access" | "jobs" | "moves" | "foods" | "payments";
  risk: CareOSToolRisk;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  requiredPermissions: string[];
  requiredConsentScopes: CareOSConsentScope[];
  authorityLevel: CareOSAuthorityLevel;
  requiresParticipantConfirmation: boolean;
  execute: (input: TInput, context: CareOSContext) => Promise<TOutput>;
};
