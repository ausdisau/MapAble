import { getProviderFinderChatBot, isProviderFinderChatBotConfigured } from "@/lib/provider/finder/chat-sdk/find-bot";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isProviderFinderChatBotConfigured()) {
    return Response.json(
      {
        error:
          "Slack adapter is not configured. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET.",
      },
      { status: 503 },
    );
  }

  const bot = getProviderFinderChatBot();

  if (!("slack" in bot.webhooks)) {
    return Response.json({ error: "Slack adapter not registered." }, { status: 503 });
  }

  return bot.webhooks.slack(request);
}
