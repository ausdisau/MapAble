import { eq } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { accessContextProfiles, chatSessions, users } from "@shared/schema";
import type { ChatContext, ClientContext } from "./types";

/**
 * Build the typed per-turn ChatContext once. User, access profile, session
 * channel and staff/admin status are resolved here so module handlers receive
 * them ready-made instead of each re-querying storage.
 */
export async function buildChatContext(
  sessionId: string,
  userId: string,
  clientContext?: ClientContext
): Promise<ChatContext> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [profile] = await db
    .select()
    .from(accessContextProfiles)
    .where(eq(accessContextProfiles.userId, userId));
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId));

  const isStaffOrAdmin =
    user?.role === "admin" || user?.role === "provider" || user?.role === "carer";

  return {
    sessionId,
    userId,
    channel: session?.channel || "web",
    user: user || null,
    profile: profile || null,
    isStaffOrAdmin,
    clientContext,
    db,
    storage,
  };
}
