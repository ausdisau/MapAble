import OpenAI from "openai";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  accessContextProfiles,
  chatSessions,
  chatMessages,
  communityReports,
  workers,
  users,
  transportRequests,
  pricingTiers,
  type AccessContextProfile,
  type ChatSession,
  type ChatMessage,
  type CommunityReport,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are MapAble Chat, an accessibility-context travel and support assistant for the MapAble 4.0 platform — an Australian NDIS superapp. You help people with disability plan accessible journeys, understand transport options, report accessibility barriers, and navigate NDIS support services.

Your core principles:
- SAFETY FIRST: Never suggest stairs if the user's profile says stairs_allowed=false. Never suggest routes that exceed their max transfer distance.
- LAYERED ANSWERS: Always structure responses as: 1) Brief headline, 2) Key details/risks, 3) Recommended actions
- CONFIDENCE DISCLOSURE: Be transparent about what you know vs what you're uncertain about
- PRIVACY BY DEFAULT: Never share diagnosis labels. Only reference mobility needs in functional terms.
- AUSTRALIAN CONTEXT: You operate in Australia. Reference Australian transport systems, NDIS terminology, and local accessibility standards.
- EMPOWERING TONE: Speak respectfully and practically. Support independence without being patronising.

You have access to tools to:
- Look up the user's accessibility profile
- Search for accessible transport workers
- Check community barrier reports for locations
- Help submit new barrier reports
- Look up transport pricing
- Help book transport
- Escalate to human support when needed

When the user asks about journey planning, always consider their accessibility profile (mobility aids, stairs capability, transfer distance, sensory preferences). When providing transport options, reference MapAble's real workers and pricing tiers.

For disruption or barrier situations, provide clear "what to do next" guidance with actionable options.

Always end responses with relevant quick action suggestions when appropriate.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Retrieve the user's accessibility context profile including mobility aids, transfer distance limits, stairs capability, sensory preferences, and assistance needs.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_transport_workers",
      description: "Search for available transport-capable support workers. Can filter by wheelchair accessibility.",
      parameters: {
        type: "object",
        properties: {
          wheelchairAccessible: { type: "boolean", description: "Filter for wheelchair accessible vehicles" },
          location: { type: "string", description: "Location area to search in" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_barrier_reports",
      description: "Check community-reported accessibility barriers at a specific location or area.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "Location or area to check for barrier reports" },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transport_pricing",
      description: "Get current NDIS transport pricing tiers including per-km rates and accessible vehicle surcharges.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_barrier_report",
      description: "Submit a community barrier report about an accessibility issue at a location.",
      parameters: {
        type: "object",
        properties: {
          locationRef: { type: "string", description: "Location where the barrier is" },
          barrierType: {
            type: "string",
            enum: ["lift_out", "ramp_blocked", "path_closed", "door_too_heavy", "kerb_ramp_missing", "inaccessible_toilet", "unsafe_crossing", "driver_bypass", "helpful_staff", "other"],
            description: "Type of accessibility barrier",
          },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Severity of the barrier" },
          description: { type: "string", description: "Detailed description of the barrier" },
        },
        required: ["locationRef", "barrierType", "severity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_transport",
      description: "Initiate a transport booking for the user with an accessible vehicle if needed.",
      parameters: {
        type: "object",
        properties: {
          pickup: { type: "string", description: "Pickup location" },
          dropoff: { type: "string", description: "Dropoff location" },
          date: { type: "string", description: "Date for the trip (YYYY-MM-DD)" },
          time: { type: "string", description: "Preferred time" },
          wheelchairRequired: { type: "boolean", description: "Whether wheelchair accessible vehicle is needed" },
        },
        required: ["pickup", "dropoff"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escalate the conversation to human support when the user needs help beyond what the chatbot can provide, or expresses distress.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" },
        },
        required: ["reason"],
      },
    },
  },
];

async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  userId: string
): Promise<string> {
  switch (toolName) {
    case "get_user_profile": {
      const [profile] = await db
        .select()
        .from(accessContextProfiles)
        .where(eq(accessContextProfiles.userId, userId));
      if (!profile) {
        return JSON.stringify({
          message: "No accessibility profile found. The user hasn't set up their access profile yet.",
          suggestion: "Ask the user about their mobility needs, sensory preferences, and assistance requirements to provide better guidance.",
        });
      }
      return JSON.stringify({
        mobilityAids: profile.mobilityAids,
        maxTransferM: profile.maxTransferM,
        stairsAllowed: profile.stairsAllowed,
        sensoryPreferences: profile.sensoryPreferences,
        communicationMode: profile.communicationMode,
        assistancePreferences: profile.assistancePreferences,
      });
    }

    case "search_transport_workers": {
      const allWorkers = await db
        .select()
        .from(workers)
        .innerJoin(users, eq(workers.userId, users.id))
        .where(eq(workers.transportCapable, true));

      let results = allWorkers.map((w) => ({
        name: w.users.fullName,
        title: w.workers.title,
        location: w.users.location,
        rating: w.workers.rating,
        reviewCount: w.workers.reviewCount,
        hourlyRate: w.workers.hourlyRate,
        transportType: w.workers.transportType,
        wheelchairAccessible: w.workers.wheelchairAccessible,
        availability: w.workers.availability,
        ndisVerified: w.workers.ndisVerified,
        workerId: w.workers.id,
      }));

      if (args.wheelchairAccessible) {
        results = results.filter((w) => w.wheelchairAccessible);
      }

      return JSON.stringify({
        workers: results,
        count: results.length,
        note: "All workers shown are NDIS verified and transport capable.",
      });
    }

    case "check_barrier_reports": {
      const reports = await db
        .select()
        .from(communityReports)
        .where(eq(communityReports.moderationStatus, "unverified"))
        .orderBy(desc(communityReports.createdAt))
        .limit(10);

      const locationLower = (args.location || "").toLowerCase();
      const relevant = reports.filter((r) =>
        r.locationRef.toLowerCase().includes(locationLower)
      );

      if (relevant.length === 0) {
        return JSON.stringify({
          message: `No barrier reports found for "${args.location}". This could mean the area is accessible or no reports have been submitted yet.`,
          confidence: "low — no community data available",
        });
      }

      return JSON.stringify({
        reports: relevant.map((r) => ({
          type: r.barrierType,
          severity: r.severity,
          location: r.locationRef,
          description: r.description,
          reportedAt: r.createdAt,
          status: r.moderationStatus,
        })),
        confidence: "medium — based on community reports",
      });
    }

    case "get_transport_pricing": {
      const tiers = await db
        .select()
        .from(pricingTiers)
        .where(eq(pricingTiers.serviceType, "transport"));
      return JSON.stringify({
        tiers: tiers.map((t) => ({
          name: t.tierName,
          rate: `$${t.rate}/km`,
          range: `${t.minUsage}–${t.maxUsage || "∞"} km/month`,
          ndisItemCode: t.ndisItemCode,
        })),
        note: "NDIS transport pricing. Accessible vehicle surcharge of $2.76/km applies for wheelchair accessible vehicles.",
      });
    }

    case "submit_barrier_report": {
      const [report] = await db
        .insert(communityReports)
        .values({
          reporterUserId: userId,
          locationRef: args.locationRef,
          barrierType: args.barrierType,
          severity: args.severity,
          description: args.description || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();

      return JSON.stringify({
        success: true,
        reportId: report.id,
        message: `Barrier report submitted for ${args.locationRef}. Thank you for helping improve accessibility information for the community.`,
      });
    }

    case "book_transport": {
      const today = new Date().toISOString().split("T")[0];
      return JSON.stringify({
        action: "navigate_to_transport",
        prefilled: {
          pickup: args.pickup,
          dropoff: args.dropoff,
          date: args.date || today,
          time: args.time || "09:00",
          wheelchairRequired: args.wheelchairRequired || false,
        },
        message: "I've prepared a transport booking for you. You can complete it on the Transport page.",
        quickAction: "book_transport",
      });
    }

    case "escalate_to_human": {
      return JSON.stringify({
        escalated: true,
        message: "I've flagged this for human support. A MapAble team member will follow up. In the meantime, you can contact MapAble support at support@mapable.com.au or call 1800 MAPABLE.",
        reason: args.reason,
        quickActions: ["call_support", "email_support"],
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

function applyRulesEngine(
  response: string,
  profile: AccessContextProfile | null
): { content: string; warnings: string[] } {
  const warnings: string[] = [];

  if (profile) {
    if (!profile.stairsAllowed && /\bstairs\b/i.test(response) && !/\bno stairs\b/i.test(response) && !/\bavoid stairs\b/i.test(response) && !/\bwithout stairs\b/i.test(response)) {
      warnings.push("Note: Your profile indicates stairs are not suitable. Any route suggestions have been checked for step-free alternatives.");
    }

    if (profile.maxTransferM && profile.maxTransferM < 100) {
      if (/\b(long walk|extended transfer|far transfer)\b/i.test(response)) {
        warnings.push(`Note: Your maximum transfer distance is ${profile.maxTransferM}m. Routes with longer transfers have been flagged.`);
      }
    }
  }

  return { content: response, warnings };
}

export interface ChatResponse {
  content: string;
  quickActions: string[];
  confidence: string;
  warnings: string[];
  toolsUsed: string[];
}

export async function processChat(
  sessionId: string,
  userId: string,
  userMessage: string
): Promise<ChatResponse> {
  const existingMessages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  await db.insert(chatMessages).values({
    sessionId,
    role: "user",
    content: userMessage,
  });

  let [profile] = await db
    .select()
    .from(accessContextProfiles)
    .where(eq(accessContextProfiles.userId, userId));

  const toolsUsed: string[] = [];
  let response: OpenAI.Chat.Completions.ChatCompletion;
  let assistantContent = "";
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;
    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatHistory,
      tools,
      tool_choice: "auto",
      max_tokens: 2048,
    });

    const choice = response.choices[0];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      chatHistory.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        toolsUsed.push(toolCall.function.name);

        const toolResult = await executeToolCall(
          toolCall.function.name,
          args,
          userId
        );

        chatHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
      continue;
    }

    assistantContent = choice.message.content || "";
    break;
  }

  const { content: processedContent, warnings } = applyRulesEngine(
    assistantContent,
    profile || null
  );

  const quickActions = extractQuickActions(processedContent, toolsUsed);
  const confidence = determineConfidence(toolsUsed);

  await db.insert(chatMessages).values({
    sessionId,
    role: "assistant",
    content: processedContent,
    toolCalls: toolsUsed.length > 0 ? toolsUsed : null,
    quickActions: quickActions.length > 0 ? quickActions : null,
    confidence,
  });

  if (existingMessages.length === 0) {
    const titleSnippet = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
    await db
      .update(chatSessions)
      .set({ title: titleSnippet })
      .where(eq(chatSessions.id, sessionId));
  }

  return {
    content: processedContent,
    quickActions,
    confidence,
    warnings,
    toolsUsed,
  };
}

function extractQuickActions(content: string, toolsUsed: string[]): string[] {
  const actions: string[] = [];

  if (/transport|trip|travel|journey|ride/i.test(content)) {
    actions.push("book_transport");
  }
  if (/barrier|blocked|broken|out of order|closed/i.test(content)) {
    actions.push("report_barrier");
  }
  if (/worker|carer|support/i.test(content) && toolsUsed.includes("search_transport_workers")) {
    actions.push("view_workers");
  }
  if (/help|stuck|emergency|unsafe/i.test(content)) {
    actions.push("escalate");
  }
  if (/profile|preference|mobility|access need/i.test(content)) {
    actions.push("edit_profile");
  }
  if (/pric|cost|rate|budget/i.test(content)) {
    actions.push("view_pricing");
  }

  return [...new Set(actions)];
}

function determineConfidence(toolsUsed: string[]): string {
  if (toolsUsed.includes("get_transport_pricing") || toolsUsed.includes("search_transport_workers")) {
    return "high";
  }
  if (toolsUsed.includes("check_barrier_reports")) {
    return "medium";
  }
  if (toolsUsed.length === 0) {
    return "general";
  }
  return "medium";
}

export async function createChatSession(userId: string, title?: string): Promise<ChatSession> {
  const [session] = await db
    .insert(chatSessions)
    .values({ userId, title: title || "New conversation" })
    .returning();
  return session;
}

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.startedAt));
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}
