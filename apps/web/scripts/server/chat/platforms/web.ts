import type { ChatResponse, InboundMessage, PlatformAdapter, RawInbound } from "../types";

/**
 * The web channel adapter — the first PlatformAdapter implementation. It maps
 * the Express `/api/chat/send` request body to a normalised InboundMessage and
 * returns the ChatResponse unchanged for JSON serialisation. Additional
 * channels (SMS, voice) implement the same seam without touching the engine.
 */
export class WebPlatformAdapter implements PlatformAdapter {
  readonly channel = "web";

  parseInbound(raw: RawInbound): InboundMessage {
    return {
      sessionId: raw.sessionId,
      userId: raw.userId,
      text: raw.message,
      channel: this.channel,
      clientContext: raw.clientContext,
    };
  }

  formatOutbound(response: ChatResponse): ChatResponse {
    return response;
  }
}

export const webPlatformAdapter = new WebPlatformAdapter();
