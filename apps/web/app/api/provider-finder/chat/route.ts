import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";

import {
  appendProviderFinderTurn,
  getProviderFinderSession,
  priorAppliedFromSession,
  touchProviderFinderSession,
} from "@/lib/ai/agent-sessions/provider-finder-session";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { runProviderFinderAskTurn } from "@/lib/provider/finder/ask-bridge";
import { extractLastUserText } from "@/lib/provider/finder/conversation/extract-user-text";
import { createFinderChatResponseStream } from "@/lib/provider/finder/conversation/stream-assistant";
import type { ProviderFinderChatUIMessage } from "@/types/provider-finder-chat";

/** Streaming chat for guided search and Provider Finder dialogue. */
export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: {
    messages?: ProviderFinderChatUIMessage[];
    sessionId?: string;
    session?: {
      query?: string;
      location?: string;
      providerName?: string;
      serviceQuery?: string;
      accessQuery?: string;
    };
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const userText = extractLastUserText(messages as UIMessage[]);

  if (!userText.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const sessionId =
    body.sessionId?.trim() || `finder-${Date.now()}`;
  const formSession = {
    query: body.session?.query ?? "",
    location: body.session?.location ?? "",
    providerName: body.session?.providerName ?? "",
    serviceQuery: body.session?.serviceQuery ?? "",
    accessQuery: body.session?.accessQuery ?? "",
  };

  try {
    touchProviderFinderSession(sessionId);
    const existing = getProviderFinderSession(sessionId);
    const priorApplied = priorAppliedFromSession(sessionId, formSession);

    const turn = await runProviderFinderAskTurn(userText, formSession, {
      priorApplied,
      agentSessionId: sessionId,
      agentTurnIndex: existing?.turnIndex ?? 0,
    });

    if (turn.agent) {
      appendProviderFinderTurn(sessionId, {
        userText,
        assistantText: turn.replyText,
        applied: turn.applied,
        interpretation: turn.interpretation,
        agent: turn.agent,
      });
    }

    const stream = createFinderChatResponseStream({
      turn,
      useLlmStream: isSearchInterpreterConfigured(),
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("[provider-finder/chat]", err);
    return Response.json(
      { error: "Could not process your message." },
      { status: 502 },
    );
  }
}
