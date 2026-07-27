import type { ChatContext, ChatModule, IntentRouter } from "./types";

/**
 * KeywordIntentRouter narrows the tool list exposed to the LLM each turn.
 *
 * Strategy (documented for behaviour parity):
 * 1. Modules flagged `alwaysOn` are ALWAYS included (profile, safeguarding,
 *    handoff) so safety and escalation paths never disappear.
 * 2. Other modules are included when any of their `intents` keywords appears in
 *    the user's message.
 * 3. MULTI-INTENT: keyword matching is additive across domains. A message that
 *    hits keywords in several modules (e.g. "what's my transport budget AND can
 *    you book a shift?") includes EVERY matched module — one domain's match
 *    never narrows away another matched domain's tools.
 * 4. FALLBACK (widening rule): the router widens to ALL modules if and only if
 *    ZERO keyword-driven modules matched. This guarantees the assistant is
 *    never under-equipped on an ambiguous turn and preserves the previous
 *    behaviour where all tools were always available. If at least one module
 *    matched, the router narrows — partial ambiguity is handled by rule 3
 *    (all matched domains stay in), not by widening to everything.
 */
export class KeywordIntentRouter implements IntentRouter {
  selectModules(message: string, modules: ChatModule[], _ctx: ChatContext): ChatModule[] {
    const lower = (message || "").toLowerCase();
    const alwaysOn = modules.filter((m) => m.alwaysOn);
    const matched = modules.filter(
      (m) => !m.alwaysOn && m.intents.some((kw) => lower.includes(kw))
    );

    if (matched.length === 0) {
      // Ambiguous turn — fall back to the full module set.
      return modules;
    }

    const selected: ChatModule[] = [...alwaysOn];
    for (const m of matched) {
      if (!selected.includes(m)) selected.push(m);
    }
    return selected;
  }
}

export const defaultIntentRouter = new KeywordIntentRouter();
