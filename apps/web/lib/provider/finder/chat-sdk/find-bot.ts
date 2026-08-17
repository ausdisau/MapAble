import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { Chat } from "chat";

import { runProviderFinderAskTurn } from "@/lib/provider/finder/ask-bridge";
import { streamFinderAssistantText } from "@/lib/provider/finder/conversation/stream-assistant";

function hasSlackCredentials(): boolean {
  return Boolean(
    process.env.SLACK_BOT_TOKEN?.trim() &&
      process.env.SLACK_SIGNING_SECRET?.trim(),
  );
}

function createFinderBot() {
  if (!hasSlackCredentials()) {
    throw new Error("Slack credentials are required for the finder Chat SDK bot");
  }

  const bot = new Chat({
    userName: "mapable-finder",
    adapters: {
      slack: createSlackAdapter(),
    },
    state: createMemoryState(),
    dedupeTtlMs: 600_000,
    streamingUpdateIntervalMs: 500,
  });

  async function replyWithTurn(
    post: (content: AsyncIterable<string>) => Promise<unknown>,
    userText: string,
  ) {
    const turn = await runProviderFinderAskTurn(userText);
    await post(streamFinderAssistantText(turn));
  }

  bot.onDirectMessage(async (thread, message) => {
    await thread.subscribe();
    await replyWithTurn((content) => thread.post(content), message.text);
  });

  bot.onNewMention(async (thread, message) => {
    await thread.subscribe();
    await replyWithTurn((content) => thread.post(content), message.text);
  });

  bot.onSlashCommand(["/finder", "/providers"], async (event) => {
    const query = event.text?.trim() || "help finding NDIS providers";
    await replyWithTurn((content) => event.channel.post(content), query);
  });

  return bot;
}

let botInstance: ReturnType<typeof createFinderBot> | null = null;

export function getProviderFinderChatBot() {
  if (!botInstance) {
    botInstance = createFinderBot();
  }
  return botInstance;
}

export function isProviderFinderChatBotConfigured(): boolean {
  return hasSlackCredentials();
}
