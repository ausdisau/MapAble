/**
 * MapAble Chat core — public surface.
 *
 * The engine, module registry, intent router, typed context and platform
 * adapters live here. Existing callers import these names through the
 * `server/chat-engine.ts` shim, which simply re-exports this module.
 */
export { processChat, processInbound, registry } from "./engine";
export { createChatSession, getUserSessions, getSessionMessages, deleteChatSession } from "./sessions";
export { ModuleRegistry } from "./registry";
export { KeywordIntentRouter, defaultIntentRouter } from "./router";
export { buildChatContext } from "./context";
export { SYSTEM_PROMPT } from "./prompt";
export { extractQuickActions, determineConfidence } from "./quick-actions";
export { chatModules } from "./modules";
export { WebPlatformAdapter, webPlatformAdapter } from "./platforms/web";
export type {
  ChatModule,
  ChatContext,
  ChatResponse,
  ClientContext,
  ClientCartItem,
  ToolHandler,
  IntentRouter,
  PlatformAdapter,
  InboundMessage,
  RawInbound,
} from "./types";
