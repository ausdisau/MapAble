import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatHandoffs, type ChatHandoff, type InsertChatHandoff } from "@shared/schema";

/**
 * Storage for human-handoff records. Handoffs move through the lifecycle
 * requested → assigned → resolved and are surfaced to staff.
 */
export const chatStorage = {
  async createChatHandoff(data: InsertChatHandoff): Promise<ChatHandoff> {
    const [handoff] = await db.insert(chatHandoffs).values(data).returning();
    return handoff;
  },

  async getChatHandoffs(status?: string): Promise<ChatHandoff[]> {
    const query = db.select().from(chatHandoffs);
    const rows = status
      ? await query.where(eq(chatHandoffs.status, status)).orderBy(desc(chatHandoffs.createdAt))
      : await query.orderBy(desc(chatHandoffs.createdAt));
    return rows;
  },

  async getChatHandoffsByUser(userId: string): Promise<ChatHandoff[]> {
    return db
      .select()
      .from(chatHandoffs)
      .where(eq(chatHandoffs.userId, userId))
      .orderBy(desc(chatHandoffs.createdAt));
  },

  async updateChatHandoffStatus(
    id: string,
    data: { status?: string; assignedTo?: string | null; resolutionNotes?: string | null }
  ): Promise<ChatHandoff | undefined> {
    const [handoff] = await db
      .update(chatHandoffs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatHandoffs.id, id))
      .returning();
    return handoff;
  },
};

export type ChatStorage = typeof chatStorage;
