import {
  convertToModelMessages,
  gateway,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";

export const maxDuration = 30;

const MessageInput = z.object({
  id: z.string().max(128),
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.unknown()).min(1).max(24),
});
const ChatInput = z.object({
  messages: z.array(MessageInput).min(1).max(10),
});

const MODELS = new Set(["openai/gpt-oss-20b", "openai/gpt-oss-120b"]);

const SYSTEM = [
  "You are MapAble Support Builder, a respectful assistant for Australian disability support discovery.",
  "Help a participant describe their goals and identify optional building blocks such as personal assistance, accessible transport, community participation, therapy, support coordination and employment.",
  "Ask no more than one useful clarification question at a time. Prefer plain language. The participant makes all decisions and may reject suggestions.",
  "This is an exploratory, unsent support draft. Do not claim any booking, referral, enquiry, consent, screening, eligibility, registration, funding approval or provider availability is confirmed.",
  "Never name or recommend a specific provider: live directory results are shown separately with provenance and unknowns. Never invent providers, ratings, prices or addresses.",
  "Do not diagnose, infer capacity, determine NDIS funding eligibility, or make safeguarding decisions.",
  "Do not tell people they must disclose a diagnosis, sensitive health information or exact address to use discovery.",
  "When asked for a provider, suggest entering the locality and using the Search directory control.",
  "Use 2–4 short sentences unless the participant requests more detail.",
].join(" ");

export async function POST(request: Request) {
  // Both flags default OFF. Preview deployments must additionally require
  // Vercel Authentication and a shared/distributed rate limit before public use.
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.MAPABLE_SUPPORT_BUILDER_ENABLED !== "true" ||
    process.env.MAPABLE_SUPPORT_BUILDER_AI_ENABLED !== "true"
  ) {
    return Response.json(
      { error: "AI chat is disabled. Use the manual support builder." },
      { status: 503 },
    );
  }
  if (!checkIpRateLimit(getClientIp(request), { windowMs: 60_000, max: 8 })) {
    return Response.json({ error: "Too many messages. Try again shortly." }, { status: 429 });
  }

  let raw: unknown;
  try {
    const body = await request.text();
    if (body.length > 40_000) {
      return Response.json({ error: "Conversation is too long." }, { status: 413 });
    }
    raw = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid message format." }, { status: 400 });
  }
  const parsed = ChatInput.safeParse(raw);
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const configuredModel = process.env.MAPABLE_SUPPORT_BUILDER_MODEL || "openai/gpt-oss-20b";
  const modelId = MODELS.has(configuredModel) ? configuredModel : "openai/gpt-oss-20b";

  // AI SDK UI messages can contain step-start and other non-text parts.
  // Only pass bounded, validated text to the model; never trust client tool parts.
  const messages = parsed.data.messages.flatMap((message) => {
    const parts = message.parts.flatMap((part) => {
      if (!part || typeof part !== "object" || !("type" in part) || !("text" in part)) {
        return [];
      }
      if (part.type !== "text" || typeof part.text !== "string") return [];
      const text = part.text.trim().slice(0, 1800);
      return text ? [{ type: "text" as const, text }] : [];
    });
    return parts.length ? [{ id: message.id, role: message.role, parts }] : [];
  }) as UIMessage[];
  if (messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Message text is required." }, { status: 400 });
  }
  try {
    const result = streamText({
      model: gateway(modelId),
      system: SYSTEM,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 350,
      abortSignal: request.signal,
    });
    return result.toUIMessageStreamResponse({
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "AI chat is unavailable. The manual support builder still works." },
      { status: 503 },
    );
  }
}
