import { isA2hHandoffEnabled } from "@/lib/act/flags";
import { createActHandoffFromHitl } from "@/lib/act/handoff/service";
import { isAuraHarnessEnabled } from "@/lib/aura-harness/config";
import {
  buildAuraBlockedToolResult,
  evaluateToolAction,
} from "@/lib/aura-harness/evaluate-action";
import type { HarnessSessionAccumulator } from "@/lib/aura-harness/session";

export type AuraHarnessWrapContext = {
  agentType: string;
  capabilityKey?: string;
  session: HarnessSessionAccumulator;
  /** Session user id for A2H handoff requester attribution. */
  userId?: string;
};

type AnyTool = {
  description?: string;
  inputSchema?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute?: (...args: any[]) => any;
  [key: string]: unknown;
};

/**
 * Wrap AI SDK tool `execute` handlers with the AURA risk harness.
 * When the harness flag is off, returns tools unchanged (no-op).
 */
export function wrapToolsWithAuraHarness<T extends Record<string, AnyTool>>(
  tools: T,
  ctx: AuraHarnessWrapContext,
): T {
  if (!isAuraHarnessEnabled()) {
    return tools;
  }

  const wrapped = {} as T;

  for (const [name, toolDef] of Object.entries(tools) as Array<
    [keyof T & string, AnyTool]
  >) {
    const originalExecute = toolDef.execute;
    if (typeof originalExecute !== "function") {
      wrapped[name as keyof T] = toolDef as T[keyof T];
      continue;
    }

    const nextTool: AnyTool = {
      ...toolDef,
      execute: (async (input: unknown, options: unknown) => {
        const evaluation = await evaluateToolAction(name, input);
        ctx.session.record(evaluation);

        const { decision, fingerprint } = evaluation;        if (
          decision.outcome === "DENIED" ||
          decision.outcome === "HITL_PENDING"
        ) {
          let handoffId: string | undefined;
          if (
            decision.outcome === "HITL_PENDING" &&
            isA2hHandoffEnabled() &&
            ctx.userId
          ) {
            try {
              const handoff = await createActHandoffFromHitl({
                fingerprint,
                toolName: name,
                payload: input,
                decision,
                requesterUserId: ctx.userId,
              });
              handoffId = handoff?.id;
            } catch {
              // Fail closed on the tool call without losing the HITL block.
            }
          }
          return buildAuraBlockedToolResult(decision, { handoffId });        }

        const args =
          decision.outcome === "MITIGATED" && decision.safeArgs !== undefined
            ? decision.safeArgs
            : input;

        return (
          originalExecute as (
            input: unknown,
            options: unknown,
          ) => unknown | Promise<unknown>
        ).call(toolDef, args, options);
      }) as AnyTool["execute"],
    };
    wrapped[name as keyof T] = nextTool as T[keyof T];
  }

  return wrapped;
}
