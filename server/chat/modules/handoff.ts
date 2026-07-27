import type { ChatModule } from "../types";
import { notifyChatHandoff } from "../../notifications";

/**
 * Human handoff. Upgraded from a flag-only escalation to a real, persisted
 * handoff record (status lifecycle: requested → assigned → resolved) that staff
 * can see and action. The chat reply acknowledges that a human has been
 * notified and surfaces a reference id.
 */
export const handoffModule: ChatModule = {
  name: "handoff",
  description: "Escalates the conversation to human support by creating a tracked handoff record and acknowledging it in the reply.",
  alwaysOn: true,
  intents: ["human", "escalate", "speak to someone", "real person", "agent", "staff", "help", "stuck", "complaint"],
  quickActions: ["escalate"],
  tools: [
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
  ],
  handlers: {
    escalate_to_human: async (args, ctx) => {
      const reason = args.reason || "User requested human support";
      try {
        const handoff = await ctx.storage.createChatHandoff({
          sessionId: ctx.sessionId,
          userId: ctx.userId,
          reason,
          channel: ctx.channel,
        });
        // Alert staff only after the handoff record is persisted (never on the
        // fail-closed path). Fire-and-forget: notification failures are logged
        // inside notifyChatHandoff and must not block the chat reply.
        void notifyChatHandoff({
          handoffId: handoff.id,
          sessionId: ctx.sessionId,
          channel: ctx.channel,
        }).catch((e) =>
          console.warn("[handoff] staff notification failed:", e instanceof Error ? e.message : e),
        );
        return JSON.stringify({
          escalated: true,
          handoffId: handoff.id,
          status: "requested",
          message: "I've flagged this for human support. A MapAble team member will follow up. In the meantime, you can contact MapAble support at support@mapable.com.au or call 1800 MAPABLE.",
          reason,
          quickActions: ["call_support", "email_support"],
        });
      } catch (error) {
        // Fail closed: never tell the user a handoff was created if it wasn't.
        console.error("Failed to create chat handoff record:", error);
        return JSON.stringify({
          escalated: false,
          handoffId: null,
          status: "error",
          message: "I couldn't automatically log this for human support. Please contact MapAble support directly at support@mapable.com.au or call 1800 MAPABLE so a team member can help you right away.",
          reason,
          quickActions: ["call_support", "email_support"],
        });
      }
    },
  },
};
