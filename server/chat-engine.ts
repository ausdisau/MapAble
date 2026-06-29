/**
 * Backwards-compatible shim. The MapAble Chat engine has been refactored into a
 * modular Concierge-style architecture under `server/chat/`. This file re-exports
 * the public surface so existing imports (`./chat-engine` / `../../chat-engine`)
 * keep working unchanged. See `server/chat/README.md` for the architecture.
 */
export * from "./chat";
