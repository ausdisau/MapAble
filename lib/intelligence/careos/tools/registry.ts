import { z } from "zod";

import { auditCareOSEvent } from "../audit/audit-service";
import { isCareOSModuleEnabled, type CareOSModule } from "../config/feature-flags";
import type { CareOSContext } from "../context/careos-context";
import { getMissingConsentScopes, CareOSConsentError } from "../consent/consent-service";
import { isAuthorityLevelAllowed } from "../policy/autonomy";
import { CareOSPolicyError } from "../policy/prohibited-uses";
import type { CareOSToolDefinition } from "./tool-definition";

export class CareOSToolError extends Error {
  constructor(
    public readonly code:
      | "FEATURE_DISABLED"
      | "PERMISSION_DENIED"
      | "CONSENT_REQUIRED"
      | "TOOL_INPUT_INVALID"
      | "RESTRICTED_TOOL",
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "CareOSToolError";
  }
}

export class CareOSToolRegistry {
  private readonly definitions = new Map<string, CareOSToolDefinition<unknown, unknown>>();

  register<TInput, TOutput>(definition: CareOSToolDefinition<TInput, TOutput>): void {
    if (this.definitions.has(definition.name)) {
      throw new Error(`Duplicate CareOS tool: ${definition.name}`);
    }
    if (definition.risk !== "read") {
      throw new CareOSToolError(
        "RESTRICTED_TOOL",
        "CareOS Foundation permits read-only tools only."
      );
    }
    this.definitions.set(
      definition.name,
      definition as CareOSToolDefinition<unknown, unknown>
    );
  }

  async execute<TOutput>(
    name: string,
    input: unknown,
    context: CareOSContext
  ): Promise<TOutput> {
    const definition = this.definitions.get(name);
    if (!definition) throw new CareOSToolError("RESTRICTED_TOOL", "Tool is unavailable.");
    const moduleFlag = `${definition.module}Enabled` as CareOSModule;
    if (!isCareOSModuleEnabled(moduleFlag)) {
      throw new CareOSToolError("FEATURE_DISABLED", "This CareOS module is disabled.");
    }
    if (!isAuthorityLevelAllowed(definition.authorityLevel)) {
      throw new CareOSPolicyError("AUTHORITY_LEVEL_DENIED", "Action exceeds the production authority ceiling.");
    }
    const missingPermissions = definition.requiredPermissions.filter(
      (permission) => !context.actor.permissions.includes(permission)
    );
    if (missingPermissions.length > 0) {
      throw new CareOSToolError("PERMISSION_DENIED", "Permission denied.", missingPermissions);
    }
    const missingScopes = getMissingConsentScopes(
      context,
      definition.requiredConsentScopes
    );
    if (missingScopes.length > 0) {
      throw new CareOSConsentError(missingScopes);
    }
    const parsed = definition.inputSchema.safeParse(input);
    if (!parsed.success) {
      throw new CareOSToolError(
        "TOOL_INPUT_INVALID",
        "Tool input is invalid.",
        z.treeifyError(parsed.error)
      );
    }
    await auditCareOSEvent(context, {
      action: "tool_called",
      tool: definition.name,
      risk: definition.risk,
      decision: "allowed",
    });
    const output = await definition.execute(parsed.data, context);
    return definition.outputSchema.parse(output) as TOutput;
  }

  list(): ReadonlyArray<CareOSToolDefinition<unknown, unknown>> {
    return [...this.definitions.values()];
  }
}
