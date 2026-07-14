import { createHash } from "crypto";

import {
  actionDecisionSchema,
  autonomyLevelSchema,
  type AuthorityGrant,
  type DomainIntent,
  type PolicyDecision,
  type ProposedAction,
} from "@mapable/contracts";
import { z } from "zod";

export const kernelStateSchema = z.enum([
  "RECEIVE",
  "VALIDATE",
  "UNDERSTAND",
  "RETRIEVE",
  "PLAN",
  "CRITIQUE",
  "AUTHORISE",
  "CONFIRM",
  "EXECUTE_OR_DRY_RUN",
  "VERIFY",
  "RECORD",
  "RESPOND",
]);
export type KernelState = z.infer<typeof kernelStateSchema>;

export type CapabilityDefinition<TInput, TOutput> = {
  id: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  autonomyCeiling: z.infer<typeof autonomyLevelSchema>;
  risk: "read" | "draft" | "write" | "restricted";
  sideEffect: "none" | "external";
  timeoutMs: number;
  requiredActions: string[];
  confirmationRequired: boolean;
  execute: (input: TInput, options: { dryRun: boolean; idempotencyKey: string }) => Promise<TOutput>;
};

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, CapabilityDefinition<unknown, unknown>>();

  register<TInput, TOutput>(definition: CapabilityDefinition<TInput, TOutput>): void {
    if (definition.sideEffect !== "none" || definition.risk !== "read") {
      throw new Error("KERNEL_SYNTHETIC_READ_ONLY_REQUIRED");
    }
    this.capabilities.set(definition.id, definition as CapabilityDefinition<unknown, unknown>);
  }

  get(id: string): CapabilityDefinition<unknown, unknown> | undefined {
    return this.capabilities.get(id);
  }
}

export function authoriseIntent(params: {
  authority: AuthorityGrant;
  intent: DomainIntent;
  now?: Date;
}): PolicyDecision {
  const now = params.now ?? new Date();
  if (params.authority.revokedAt || new Date(params.authority.expiresAt) <= now) {
    return { schemaVersion: "1.0", decision: "deny", reasonCodes: ["AUTHORITY_INACTIVE"], authorityId: params.authority.id };
  }
  if (params.intent.risk === "high" || params.intent.reversibility !== "reversible") {
    return { schemaVersion: "1.0", decision: "require_human_review", reasonCodes: ["RISK_OR_REVERSIBILITY_REVIEW"], authorityId: params.authority.id };
  }
  if (!params.authority.permittedActions.includes(params.intent.proposedAction)) {
    return { schemaVersion: "1.0", decision: "deny", reasonCodes: ["ACTION_NOT_GRANTED"], authorityId: params.authority.id };
  }
  if (params.authority.autonomyCeiling < 2) {
    return { schemaVersion: "1.0", decision: "allow_display", reasonCodes: ["RECOMMENDATION_ONLY"], authorityId: params.authority.id };
  }
  return { schemaVersion: "1.0", decision: "require_confirmation", reasonCodes: ["PARTICIPANT_CONFIRMATION_REQUIRED"], authorityId: params.authority.id };
}

export type AuditChainEntry = {
  id: string;
  previousHash: string | null;
  currentHash: string;
  payload: Record<string, unknown>;
};

export class AuditChain {
  private lastHash: string | null = null;
  private readonly entries: AuditChainEntry[] = [];

  append(id: string, payload: Record<string, unknown>): AuditChainEntry {
    const previousHash = this.lastHash;
    const currentHash = createHash("sha256")
      .update(JSON.stringify({ previousHash, id, payload }))
      .digest("hex");
    const entry = { id, previousHash, currentHash, payload };
    this.entries.push(entry);
    this.lastHash = currentHash;
    return entry;
  }

  verify(): boolean {
    let previousHash: string | null = null;
    return this.entries.every((entry) => {
      const expected = createHash("sha256")
        .update(JSON.stringify({ previousHash, id: entry.id, payload: entry.payload }))
        .digest("hex");
      previousHash = entry.currentHash;
      return expected === entry.currentHash;
    });
  }
}

export type DeterministicModelProvider = {
  id: "deterministic-fake";
  plan: (input: unknown) => Promise<unknown>;
};

export const deterministicFakeModel: DeterministicModelProvider = {
  id: "deterministic-fake",
  async plan(input) {
    return input;
  },
};

export type IntelligencePlanner = {
  id: string;
  propose: (input: unknown) => Promise<unknown>;
};
export type ContextProvider<TContext> = {
  build: (request: unknown) => Promise<TContext>;
};
export type PolicyEvaluator = {
  evaluate: (params: { authority: AuthorityGrant; intent: DomainIntent }) => PolicyDecision;
};
export type ActionExecutor = {
  execute: (action: unknown, token: string) => Promise<never>;
};
export type AuditRecorder = {
  record: (event: Record<string, unknown>) => Promise<void>;
};
export type HumanReviewRouter = {
  route: (reasonCodes: string[]) => Promise<void>;
};

export function decideProposedAction(params: {
  action: ProposedAction;
  authority: AuthorityGrant | null;
  capabilityEnabled: boolean;
  evidenceComplete: boolean;
  safeguardingSignal?: boolean;
  now?: Date;
}): { decision: z.infer<typeof actionDecisionSchema>; reasonCodes: string[] } {
  const now = params.now ?? new Date();
  if (params.safeguardingSignal) {
    return { decision: "ESCALATE_SAFEGUARDING", reasonCodes: ["SAFEGUARDING_HUMAN_ONLY"] };
  }
  if (!params.capabilityEnabled) {
    return { decision: "DENY_NO_AUTHORITY", reasonCodes: ["CAPABILITY_DISABLED"] };
  }
  if (!params.authority) {
    return { decision: "DENY_NO_AUTHORITY", reasonCodes: ["AUTHORITY_MISSING"] };
  }
  if (params.authority.revokedAt || new Date(params.authority.expiresAt) <= now) {
    return { decision: "DENY_EXPIRED", reasonCodes: ["AUTHORITY_INACTIVE"] };
  }
  if (params.action.autonomyLevel > 2 || params.action.operation.includes("execute")) {
    return { decision: "DENY_PROHIBITED", reasonCodes: ["SYNTHETIC_L2_CEILING"] };
  }
  if (!params.evidenceComplete) {
    return { decision: "REQUIRE_MORE_EVIDENCE", reasonCodes: ["EVIDENCE_INCOMPLETE"] };
  }
  if (!params.authority.permittedActions.includes(params.action.operation)) {
    return { decision: "DENY_NO_AUTHORITY", reasonCodes: ["ACTION_NOT_GRANTED"] };
  }
  return {
    decision: params.action.confirmationRequired
      ? "REQUIRE_PARTICIPANT_CONFIRMATION"
      : "ALLOW_DRAFT",
    reasonCodes: ["POLICY_REQUIREMENTS_SATISFIED"],
  };
}
