import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { chatMessages, chatSessions, type AccessContextProfile } from "@shared/schema";
import {
  applyOutputGuardrails,
  classifyUserTurn,
  ensureGuardrailTables,
  logGuardrailAudit,
  runRequiredSafeguardingActions,
  safeguardingTemplate,
} from "../chat-guardrails";
import { buildChatContext } from "./context";
import { ModuleRegistry } from "./registry";
import { defaultIntentRouter } from "./router";
import { chatModules } from "./modules";
import { SYSTEM_PROMPT } from "./prompt";
import { determineConfidence, extractQuickActions } from "./quick-actions";
import type {
  ChatContext,
  ChatResponse,
  ClientContext,
  IntentRouter,
  PlatformAdapter,
  RawInbound,
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export const registry = new ModuleRegistry(chatModules);
const router: IntentRouter = defaultIntentRouter;

/**
 * Post-LLM rules engine. Adds accessibility/budget warnings derived from the
 * user's profile and the tool outputs. Kept verbatim for behaviour parity.
 */
function applyRulesEngine(
  response: string,
  profile: AccessContextProfile | null,
  toolsUsed: string[] = [],
  toolOutputs: string[] = []
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

  const combinedToolOutput = toolOutputs.join(" ");

  if (toolsUsed.includes("book_shift") && /budgetWarning/i.test(combinedToolOutput)) {
    warnings.push("Budget alert: This shift may impact your remaining NDIS allocation. Check your budget summary for details.");
  }

  if (toolsUsed.includes("get_budget_summary") && /nearLimit.*true|"nearLimit":true/i.test(combinedToolOutput)) {
    warnings.push("Budget warning: One or more of your NDIS budget categories is approaching or has exceeded its allocation.");
  }

  if (toolsUsed.includes("book_shift") && /Cannot book shift/i.test(combinedToolOutput)) {
    warnings.push("Shift booking was blocked due to insufficient NDIS budget. Please review your budget allocation.");
  }

  return { content: response, warnings };
}

export async function processChat(
  sessionId: string,
  userId: string,
  userMessage: string,
  clientContext?: ClientContext
): Promise<ChatResponse> {
  await ensureGuardrailTables();

  const existingMessages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  const ctx: ChatContext = await buildChatContext(sessionId, userId, clientContext);

  const inputVerdict = classifyUserTurn(userMessage, ctx.isStaffOrAdmin);
  const guardrailToolCalls: string[] = [];
  const guardrailActions = [...inputVerdict.actions];
  const policyRefs = [...inputVerdict.policyRefs];

  await db.insert(chatMessages).values({
    sessionId,
    role: "user",
    content: userMessage,
  });

  const immediateTemplate = inputVerdict.responseTemplate || safeguardingTemplate(inputVerdict);
  if (immediateTemplate) {
    const requiredTools = await runRequiredSafeguardingActions(sessionId, userId, userMessage, inputVerdict);
    guardrailToolCalls.push(...requiredTools);

    await db.insert(chatMessages).values({
      sessionId,
      role: "assistant",
      content: immediateTemplate,
      toolCalls: guardrailToolCalls.length > 0 ? guardrailToolCalls : null,
      quickActions: ["escalate"],
      confidence: "high",
    });

    if (existingMessages.length === 0) {
      const titleSnippet = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
      await db
        .update(chatSessions)
        .set({ title: titleSnippet })
        .where(eq(chatSessions.id, sessionId));
    }

    await logGuardrailAudit({
      sessionId,
      userId,
      input: userMessage,
      output: immediateTemplate,
      toolCalls: guardrailToolCalls,
      classifierVerdicts: inputVerdict.categories,
      guardrailActions,
      policyRefs,
      flaggedForReview: guardrailToolCalls.length > 0 || inputVerdict.blocked,
    });

    return {
      content: immediateTemplate,
      quickActions: ["escalate"],
      confidence: "high",
      warnings: inputVerdict.blocked ? ["This message was handled by MapAble's safety and privacy guardrails."] : [],
      toolsUsed: guardrailToolCalls,
    };
  }

  const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: inputVerdict.transformedInput },
  ];

  // Intent router narrows the tool list for this turn (falls back to all modules).
  const selectedModules = router.selectModules(userMessage, registry.getModules(), ctx);
  const turnTools = registry.getToolsFor(selectedModules);

  const toolsUsed: string[] = [];
  const toolOutputs: string[] = [];
  let response: OpenAI.Chat.Completions.ChatCompletion;
  let assistantContent = "";
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;
    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatHistory,
      tools: turnTools,
      tool_choice: "auto",
      max_tokens: 2048,
    });

    const choice = response.choices[0];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      chatHistory.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== "function") continue;
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          args = {};
        }
        toolsUsed.push(toolCall.function.name);

        const handler = registry.getHandler(toolCall.function.name);
        const toolResult = handler
          ? await handler(args, ctx)
          : JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });

        toolOutputs.push(toolResult);

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

  const { content: rulesContent, warnings } = applyRulesEngine(
    assistantContent,
    ctx.profile,
    toolsUsed,
    toolOutputs
  );

  const outputGuardrail = applyOutputGuardrails(rulesContent);
  const processedContent = outputGuardrail.content;
  guardrailActions.push(...outputGuardrail.actions);
  policyRefs.push(...outputGuardrail.policyRefs);

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

  await logGuardrailAudit({
    sessionId,
    userId,
    input: userMessage,
    output: processedContent,
    toolCalls: [...toolsUsed, ...guardrailToolCalls],
    classifierVerdicts: inputVerdict.categories,
    guardrailActions,
    policyRefs,
    flaggedForReview: outputGuardrail.flagged || guardrailActions.includes("human_pathway") || guardrailToolCalls.length > 0,
  });

  return {
    content: processedContent,
    quickActions,
    confidence,
    warnings,
    toolsUsed,
  };
}

/**
 * Channel entry point. Normalises a raw channel payload through the
 * PlatformAdapter seam, runs the engine, then formats the outbound response for
 * the channel. The web route uses {@link webPlatformAdapter}; other channels
 * pass their own adapter without the engine needing to know the channel.
 */
export async function processInbound(adapter: PlatformAdapter, raw: RawInbound): Promise<unknown> {
  const inbound = adapter.parseInbound(raw);
  const response = await processChat(
    inbound.sessionId,
    inbound.userId,
    inbound.text,
    inbound.clientContext
  );
  return adapter.formatOutbound(response);
}
