import { runBookingServicesAgentTurn } from "@/lib/agent/booking-services-agent";
import { runProviderFinderTurnWithAgentFlag } from "@/lib/agent/run-agent-turn";
import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
  disabilityAgentJsonOk,
} from "@/lib/api/disability-agent-api-contract";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { getOptionalApiUser } from "@/lib/api/optional-session";
import { apiForbidden } from "@/lib/auth/guards";
import { shouldRouteToBookingAgent } from "@/lib/bookings/rag/copilot-route";
import { planCopilotActions } from "@/lib/copilot/actionPlanner";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { applyGuardrails } from "@/lib/copilot/guardrails";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import { planProviderFinderCopilotActions } from "@/lib/copilot/plan-provider-finder";
import type {
  CopilotAskContext,
  CopilotAskResponse,
  CopilotFinderPayload,
  CopilotProviderResult,
} from "@/lib/copilot/types";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";
import {
  serialiseFinderPayload,
  type ProviderFinderSessionFields,
} from "@/lib/provider/finder/ask-bridge";
import { planCareTransportMapActions } from "@/lib/transport/care-map/map-actions";

function parseAskContext(raw: unknown): CopilotAskContext {
  if (raw === "provider_finder") return "provider_finder";
  if (raw === "care_transport_map") return "care_transport_map";
  return "default";
}

function buildCareTransportMapAskResponse(query: string): CopilotAskResponse {
  const planned = planCareTransportMapActions(query);
  return {
    source: "mapable-copilot",
    intent: "places",
    confidence: 0.85,
    summary: planned.summary,
    answer: planned.answer,
    filters: {},
    actions: planned.mapActions.some((a) => a.type === "suggestInfrastructure")
      ? [
          {
            type: "GUIDANCE_ONLY",
            label: "Open Add infrastructure",
            requiresConfirmation: false,
          },
        ]
      : [
          {
            type: "GUIDANCE_ONLY",
            label: "Update map layers",
            requiresConfirmation: false,
          },
        ],
    draftRecords: [],
    requiredConfirmations: [],
    warnings: [
      {
        level: "info",
        message:
          "Pilot Care + Transport map. Discovery pins only; trip addresses stay role-gated. Nothing is written to OpenStreetMap.org.",
      },
    ],
    blockedActions: [],
    mapActions: planned.mapActions,
    suggestedPrompts: [
      "Care providers near Parramatta",
      "Show accessible pickup points in Sydney",
      "Add a care support hub in Newcastle",
    ],
  };
}

const OPERATION = DISABILITY_AGENT_OPERATIONS.mapableAskQuery;
const MAX_QUERY_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function parseSessionFields(
  raw: unknown,
): Partial<ProviderFinderSessionFields> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  return {
    query: typeof s.query === "string" ? s.query : "",
    location: typeof s.location === "string" ? s.location : "",
    providerName: typeof s.providerName === "string" ? s.providerName : "",
    serviceQuery: typeof s.serviceQuery === "string" ? s.serviceQuery : "",
    accessQuery: typeof s.accessQuery === "string" ? s.accessQuery : "",
  };
}

function parseMessages(
  raw: unknown,
): { role: "user" | "assistant"; content: string }[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (content) out.push({ role, content });
  }
  return out.length > 0 ? out : undefined;
}

function finderFromSerialised(
  payload: ReturnType<typeof serialiseFinderPayload>,
): CopilotFinderPayload {
  return {
    interpretation: payload.interpretation,
    applied: payload.applied,
    searchParams: payload.searchParams,
    replyText: payload.replyText,
  };
}

function responseFromProviderFinderPlan(
  planned: Awaited<ReturnType<typeof planProviderFinderCopilotActions>>,
): CopilotAskResponse {
  const finderPayload = planned.filters.finder as ReturnType<
    typeof serialiseFinderPayload
  >;
  const finder = finderFromSerialised(finderPayload);
  const results: CopilotProviderResult[] =
    planned.providerResults ?? finderPayload.providerResults ?? [];

  return {
    source: "mapable-copilot",
    intent: "provider_finder",
    confidence: 0.9,
    summary: planned.summary,
    answer: planned.plainLanguageAnswer,
    filters: planned.filters,
    actions: planned.actions,
    draftRecords: [],
    requiredConfirmations: [],
    warnings: planned.warnings,
    blockedActions: [],
    finder,
    results,
    agent: planned.agent ?? finderPayload.agent,
    suggestedPrompts: [
      "OT assessment in Parramatta",
      "Wheelchair accessible transport near me",
      "NDIS registered support worker",
    ],
  };
}

async function logProviderFinderAgentRun(
  input: {
    query: string;
    toolsCalled: string[];
    resultCount: number;
    status: string;
    participantId?: string;
  },
) {
  await createAgentRun({
    agentType: "matching",
    participantId: input.participantId,
    inputSummary: { query: input.query.slice(0, 500) },
    outputSummary: {
      resultCount: input.resultCount,
      status: input.status,
    },
    toolsCalled: input.toolsCalled,
    riskTier: "low",
    humanReviewRequired: false,
  });
}

async function buildGuestProviderFinderResponse(
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: {
    providerSlug?: string;
    providerName?: string;
    agentSessionId?: string;
    messages?: { role: "user" | "assistant"; content: string }[];
  },
): Promise<CopilotAskResponse> {
  const planned = await planProviderFinderCopilotActions(query, session, options);
  const response = responseFromProviderFinderPlan(planned);

  void logProviderFinderAgentRun({
    query,
    toolsCalled: planned.toolsCalled ?? [
      "interpretFinderQuery",
      "searchNdisProviders",
    ],
    resultCount: response.results?.length ?? 0,
    status: response.agent?.status ?? "complete",
  });

  return response;
}

async function maybeAttachFinder(
  response: CopilotAskResponse,
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: {
    providerSlug?: string;
    providerName?: string;
    agentSessionId?: string;
  },
): Promise<CopilotAskResponse> {
  if (response.intent === "incident" || response.intent === "billing") {
    return response;
  }

  const turn = await runProviderFinderTurnWithAgentFlag(query, session, options);
  const serialised = serialiseFinderPayload(turn);

  return {
    ...response,
    finder: finderFromSerialised(serialised),
    results: turn.providerResults,
    agent: turn.agent,
    filters: { ...response.filters, finder: serialised },
  };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return disabilityAgentJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  try {
    const body = await request.json();
    const query =
      typeof body.query === "string" ? body.query.trim() : "";
    const mode =
      typeof body.mode === "string" ? body.mode : "All";
    const context = parseAskContext(body.context);
    const participantId =
      typeof body.participantId === "string"
        ? body.participantId
        : undefined;
    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId
        : `session-${Date.now()}`;
    const session = parseSessionFields(body.session);
    const messages = parseMessages(body.messages);
    const providerSlug =
      typeof body.providerSlug === "string" ? body.providerSlug : undefined;
    const providerName =
      typeof body.providerName === "string" ? body.providerName : undefined;

    const finderOptions = {
      providerSlug,
      providerName,
      agentSessionId: sessionId,
      messages,
    };

    if (!query) {
      return disabilityAgentJsonError(OPERATION, 400, {
        error: "Please enter a question or request so MapAble can help.",
        code: "VALIDATION_ERROR",
        retryable: false,
      });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return disabilityAgentJsonError(OPERATION, 400, {
        error: "Your message is too long. Please shorten it and try again.",
        code: "VALIDATION_ERROR",
        retryable: false,
      });
    }

    if (context === "care_transport_map") {
      return disabilityAgentJsonOk(OPERATION, {
        ...buildCareTransportMapAskResponse(query),
        operationId: OPERATION,
      });
    }

    const user = await getOptionalApiUser();

    if (context === "provider_finder" && !user) {
      const response = await buildGuestProviderFinderResponse(
        query,
        session,
        finderOptions,
      );
      return disabilityAgentJsonOk(OPERATION, {
        ...response,
        operationId: OPERATION,
      });
    }

    if (!user) {
      const authRequired = await requireApiSession();
      if (authRequired instanceof Response) return authRequired;
      return disabilityAgentJsonError(OPERATION, 401, {
        error: "Sign in required.",
        code: "AUTH_REQUIRED",
        retryable: false,
      });
    }

    const effectiveParticipantId = participantId ?? user.id;

    try {
      await assertCanAccessParticipantData(user, effectiveParticipantId);
    } catch (e) {
      if (e instanceof ParticipantAccessError) {
        return apiForbidden(e.message);
      }
      throw e;
    }

    if (shouldRouteToBookingAgent(query)) {
      try {
        const bookingTurn = await runBookingServicesAgentTurn({
          query,
          sessionId,
          user,
        });

        void createAgentRun({
          agentType: "transport",
          participantId: effectiveParticipantId,
          inputSummary: { query: query.slice(0, 500) },
          outputSummary: {
            toolsCalled: bookingTurn.toolsCalled,
            textLength: bookingTurn.text.length,
          },
          toolsCalled: bookingTurn.toolsCalled,
          riskTier: "low",
          humanReviewRequired: false,
          actorUserId: user.id,
        });

        const bookingResponse: CopilotAskResponse = {
          source: "mapable-copilot",
          intent: "combined",
          confidence: 0.92,
          summary: "Booking lookup",
          answer: bookingTurn.text,
          filters: { bookingAgent: true, toolsCalled: bookingTurn.toolsCalled },
          actions: [],
          draftRecords: [],
          requiredConfirmations: [],
          warnings: [],
          blockedActions: [],
          results: [],
          suggestedPrompts: [
            "When is my next care visit?",
            "Status of my transport booking",
            "Show pending bookings this week",
          ],
          agent: {
            sessionId: bookingTurn.sessionId,
            turnIndex: 0,
            status: "complete",
          },
        };

        return disabilityAgentJsonOk(OPERATION, {
          ...bookingResponse,
          operationId: OPERATION,
        });
      } catch (err) {
        console.error("[mapable-ask-booking-agent]", err);
        return disabilityAgentJsonError(OPERATION, 502, {
          error: "Booking agent turn failed.",
          code: "UPSTREAM_ERROR",
          retryable: true,
        });
      }
    }

    const intent = classifyIntent(query, mode, {
      context: context === "provider_finder" ? "provider_finder" : "default",
    });
    const copilotContext = await buildCopilotContext(effectiveParticipantId);

    const planned = await planCopilotActions(
      {
        query,
        mode,
        intent,
        context: copilotContext,
        sessionId,
        participantId: effectiveParticipantId,
      },
      {
        session,
        providerSlug,
        providerName,
        agentSessionId: sessionId,
        messages,
      },
    );

    const guarded = await applyGuardrails({
      planned,
      context: copilotContext,
      participantId: effectiveParticipantId,
    });

    let response: CopilotAskResponse = {
      source: "mapable-copilot",
      intent: intent.type,
      confidence: intent.confidence,
      summary: guarded.summary,
      answer: guarded.plainLanguageAnswer,
      filters: guarded.filters,
      actions: guarded.actions,
      draftRecords: guarded.draftRecords,
      requiredConfirmations: guarded.requiredConfirmations,
      warnings: guarded.warnings,
      blockedActions: guarded.blockedActions,
      results: guarded.providerResults ?? [],
      suggestedPrompts: buildSuggestedPrompts(intent.type),
      agent: guarded.agent,
    };

    if (intent.type === "provider_finder" && guarded.filters.finder) {
      const payload = guarded.filters.finder as ReturnType<
        typeof serialiseFinderPayload
      >;
      response.finder = finderFromSerialised(payload);
      response.results =
        guarded.providerResults ?? payload.providerResults ?? [];
      response.agent = guarded.agent ?? payload.agent;
    } else if (context === "provider_finder") {
      response = await maybeAttachFinder(response, query, session, finderOptions);
    }

    if (context === "provider_finder" || intent.type === "provider_finder") {
      void logProviderFinderAgentRun({
        query,
        toolsCalled: guarded.toolsCalled ?? [
          "interpretFinderQuery",
          "searchNdisProviders",
        ],
        resultCount: response.results?.length ?? 0,
        status: response.agent?.status ?? "complete",
        participantId: effectiveParticipantId,
      });
    }

    return disabilityAgentJsonOk(OPERATION, {
      ...response,
      operationId: OPERATION,
    });
  } catch {
    return disabilityAgentJsonError(OPERATION, 500, {
      error: "Something went wrong. Please try again in a moment.",
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
  }
}

function buildSuggestedPrompts(
  intent: CopilotAskResponse["intent"],
): string[] {
  switch (intent) {
    case "provider_finder":
      return [
        "OT near Parramatta",
        "Support worker with Auslan",
        "Registered provider in Newcastle",
      ];
    case "places":
      return [
        "Care providers near Parramatta",
        "Show accessible pickup points in Sydney",
        "Add a care support hub in Newcastle",
      ];
    case "combined":
      return [
        "Add Tuesday 9am physio time",
        "Check consent for pickup notes",
      ];
    case "billing":
      return ["What evidence is missing?", "Explain this line item"];
    case "incident":
      return ["I need urgent help", "Start a complaint"];
    default:
      return [
        "I need support and transport to physio",
        "Help me understand my NDIS plan",
      ];
  }
}
