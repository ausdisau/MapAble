import type OpenAI from "openai";
import type { db } from "../db";
import type { storage } from "../storage";
import type { AccessContextProfile, User } from "@shared/schema";

export interface ClientCartItem {
  productId: string;
  name?: string;
  unit?: string;
  price?: string | number;
  quantity: number;
}

export interface ClientContext {
  groceryCart?: ClientCartItem[];
}

export interface ChatResponse {
  content: string;
  quickActions: string[];
  confidence: string;
  warnings: string[];
  toolsUsed: string[];
}

/**
 * Typed, per-turn context assembled once by `buildChatContext` and threaded
 * through every module handler so handlers do not each re-query storage for the
 * same user/profile/session facts.
 */
export interface ChatContext {
  sessionId: string;
  userId: string;
  channel: string;
  user: User | null;
  profile: AccessContextProfile | null;
  isStaffOrAdmin: boolean;
  clientContext?: ClientContext;
  db: typeof db;
  storage: typeof storage;
}

export type ToolHandler = (args: Record<string, any>, ctx: ChatContext) => Promise<string>;

/**
 * A ChatModule is a self-contained capability domain. Adding a new capability
 * to MapAble Chat means adding one module file and registering it — no edits to
 * the engine, router, or registry are required.
 */
export interface ChatModule {
  /** Stable module id, e.g. "transport". */
  name: string;
  /** Human-readable summary used in the developer docs and registry listing. */
  description: string;
  /** Lower-case keyword triggers the intent router scores the user turn against. */
  intents: string[];
  /** When true the module's tools are exposed on every turn (safety/escalation/profile). */
  alwaysOn?: boolean;
  /** Quick-action keys this module can surface (informational; extraction stays centralised). */
  quickActions?: string[];
  /** One or more OpenAI tool schemas owned by this module. */
  tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  /** Handlers keyed by the tool function name they implement. */
  handlers: Record<string, ToolHandler>;
}

/**
 * Pluggable intent router. The default {@link KeywordIntentRouter} narrows the
 * candidate tool list per turn but always falls back to every module when a turn
 * is ambiguous.
 */
export interface IntentRouter {
  selectModules(message: string, modules: ChatModule[], ctx: ChatContext): ChatModule[];
}

export interface InboundMessage {
  sessionId: string;
  userId: string;
  text: string;
  channel: string;
  clientContext?: ClientContext;
}

export interface RawInbound {
  sessionId: string;
  userId: string;
  message: string;
  clientContext?: ClientContext;
}

/**
 * PlatformAdapter is the channel seam. The web app is the first implementation;
 * future channels (SMS, voice, messaging) implement the same interface so the
 * engine stays channel-agnostic.
 */
export interface PlatformAdapter {
  readonly channel: string;
  parseInbound(raw: RawInbound): InboundMessage;
  formatOutbound(response: ChatResponse): unknown;
}
