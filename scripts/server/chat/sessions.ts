import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatMessages, chatSessions, type ChatMessage, type ChatSession } from "@shared/schema";

export async function createChatSession(userId: string, title?: string): Promise<ChatSession> {
  const [session] = await db
    .insert(chatSessions)
    .values({ userId, title: title || "New conversation" })
    .returning();
  return session;
}

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.startedAt));
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}
