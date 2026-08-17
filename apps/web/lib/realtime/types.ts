export type RealtimeEvent =
  | { type: "message:new"; conversationId: string; messageId: string }
  | { type: "message:read"; conversationId: string; messageId: string; userId: string }
  | { type: "typing:start"; conversationId: string; userId: string }
  | { type: "typing:stop"; conversationId: string; userId: string }
  | { type: "presence:update"; userId: string; status: string };

export type RealtimeProvider = "polling" | "supabase" | "socketio";
