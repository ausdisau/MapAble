import type { CopilotAgentMeta } from "@/lib/copilot/types";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

export type ProviderFinderChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProviderFinderAgentSession = {
  sessionId: string;
  messages: ProviderFinderChatMessage[];
  cumulativeApplied: AppliedSearchFields | null;
  lastInterpretation: SearchInterpretation | null;
  turnIndex: number;
  updatedAt: number;
};

const TTL_MS = 60 * 60 * 1000;
const MAX_MESSAGES = 20;

const store = new Map<string, ProviderFinderAgentSession>();

function emptyApplied(): AppliedSearchFields {
  return {
    query: "",
    location: "",
    providerName: "",
    serviceQuery: "",
    accessQuery: "",
    supportType: null,
    accessNeedIds: [],
  };
}

function pruneExpired(now: number) {
  for (const [id, session] of store) {
    if (now - session.updatedAt > TTL_MS) store.delete(id);
  }
}

export function getProviderFinderSession(
  sessionId: string,
): ProviderFinderAgentSession | null {
  pruneExpired(Date.now());
  return store.get(sessionId) ?? null;
}

export function touchProviderFinderSession(
  sessionId: string,
  initial?: Partial<ProviderFinderAgentSession>,
): ProviderFinderAgentSession {
  pruneExpired(Date.now());
  const existing = store.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }
  const created: ProviderFinderAgentSession = {
    sessionId,
    messages: initial?.messages ?? [],
    cumulativeApplied: initial?.cumulativeApplied ?? null,
    lastInterpretation: initial?.lastInterpretation ?? null,
    turnIndex: initial?.turnIndex ?? 0,
    updatedAt: Date.now(),
  };
  store.set(sessionId, created);
  return created;
}

export function appendProviderFinderTurn(
  sessionId: string,
  input: {
    userText: string;
    assistantText: string;
    applied: AppliedSearchFields;
    interpretation: SearchInterpretation;
    agent: CopilotAgentMeta;
  },
): ProviderFinderAgentSession {
  const session = touchProviderFinderSession(sessionId);
  session.messages.push({ role: "user", content: input.userText });
  session.messages.push({
    role: "assistant",
    content: input.assistantText,
  });
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  session.cumulativeApplied = input.applied;
  session.lastInterpretation = input.interpretation;
  session.turnIndex = input.agent.turnIndex;
  session.updatedAt = Date.now();
  return session;
}

export function priorAppliedFromSession(
  sessionId: string | undefined,
  formSession?: {
    query?: string;
    location?: string;
    providerName?: string;
    serviceQuery?: string;
    accessQuery?: string;
  },
): AppliedSearchFields | undefined {
  const fromStore = sessionId ? getProviderFinderSession(sessionId) : null;
  if (fromStore?.cumulativeApplied) return fromStore.cumulativeApplied;

  if (!formSession) return undefined;
  const hasAny =
    formSession.query?.trim() ||
    formSession.location?.trim() ||
    formSession.providerName?.trim() ||
    formSession.serviceQuery?.trim() ||
    formSession.accessQuery?.trim();
  if (!hasAny) return undefined;

  return {
    ...emptyApplied(),
    query: formSession.query ?? "",
    location: formSession.location ?? "",
    providerName: formSession.providerName ?? "",
    serviceQuery: formSession.serviceQuery ?? "",
    accessQuery: formSession.accessQuery ?? "",
  };
}

/** Test-only */
export function resetProviderFinderSessionsForTests() {
  store.clear();
}
