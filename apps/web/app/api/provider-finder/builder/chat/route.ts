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
  parts: z.array(
    z.object({ type: z.literal("text"), text: z.string().max(1800) }),
  ).min(1).max(3),
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
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid message format." }, { status: 400 });
  }
  const parsed = ChatInput.safeParse(raw);
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const configuredModel = process.env.MAPABLE_SUPPORT_BUILDER_MODEL || "openai/gpt-oss-20b";
  const modelId = MODELS.has(configuredModel) ? configuredModel : "openai/gpt-oss-20b";

  const messages = parsed.data.messages as UIMessage[];
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
