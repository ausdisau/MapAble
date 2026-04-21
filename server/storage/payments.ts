import {
  becsMandates, ndisClaims, stripeWebhookEvents, users, invoices,
  type BecsMandate, type InsertBecsMandate,
  type NdisClaim, type InsertNdisClaim,
  type Invoice, type User,
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";

export const paymentsStorage = {
  async createBecsMandate(data: InsertBecsMandate): Promise<BecsMandate> {
    const [m] = await db.insert(becsMandates).values(data).returning();
    return m;
  },

  async getBecsMandates(userId: string): Promise<BecsMandate[]> {
    return db.select().from(becsMandates).where(eq(becsMandates.userId, userId)).orderBy(desc(becsMandates.createdAt));
  },

  async getBecsMandate(id: string): Promise<BecsMandate | undefined> {
    const [m] = await db.select().from(becsMandates).where(eq(becsMandates.id, id));
    return m;
  },

  async getBecsMandateByPaymentMethod(stripePaymentMethodId: string): Promise<BecsMandate | undefined> {
    const [m] = await db.select().from(becsMandates).where(eq(becsMandates.stripePaymentMethodId, stripePaymentMethodId));
    return m;
  },

  async updateBecsMandateStatus(stripePaymentMethodId: string, status: string, mandateUrl?: string, stripeMandateId?: string): Promise<BecsMandate | undefined> {
    const setData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (mandateUrl) setData.mandateUrl = mandateUrl;
    if (stripeMandateId) setData.stripeMandateId = stripeMandateId;
    const [m] = await db.update(becsMandates).set(setData).where(eq(becsMandates.stripePaymentMethodId, stripePaymentMethodId)).returning();
    return m;
  },

  async deleteBecsMandate(id: string): Promise<boolean> {
    const m = await this.getBecsMandate(id);
    if (!m) return false;
    await db.delete(becsMandates).where(eq(becsMandates.id, id));
    return true;
  },

  async setDefaultBecsMandate(userId: string, mandateId: string): Promise<BecsMandate | undefined> {
    await db.update(becsMandates).set({ isDefault: false }).where(eq(becsMandates.userId, userId));
    const [m] = await db.update(becsMandates).set({ isDefault: true }).where(and(eq(becsMandates.id, mandateId), eq(becsMandates.userId, userId))).returning();
    if (m) {
      await db.update(users).set({ defaultBecsPaymentMethodId: m.stripePaymentMethodId }).where(eq(users.id, userId));
    }
    return m;
  },

  async getDefaultBecsMandate(userId: string): Promise<BecsMandate | undefined> {
    const [m] = await db.select().from(becsMandates).where(and(eq(becsMandates.userId, userId), eq(becsMandates.isDefault, true)));
    return m;
  },

  async setUserAutoDebit(userId: string, enabled: boolean, graceDays?: number): Promise<User | undefined> {
    const setData: Record<string, unknown> = { autoDebitEnabled: enabled };
    if (typeof graceDays === "number") setData.autoDebitGraceDays = graceDays;
    const [u] = await db.update(users).set(setData).where(eq(users.id, userId)).returning();
    return u;
  },

  async setStripeAccount(userId: string, data: {
    stripeAccountId?: string | null;
    stripeAccountStatus?: string | null;
    stripeChargesEnabled?: boolean;
    stripePayoutsEnabled?: boolean;
    stripeRequirementsDue?: unknown;
  }): Promise<User | undefined> {
    const [u] = await db.update(users).set(data as any).where(eq(users.id, userId)).returning();
    return u;
  },

  async getUserByStripeAccountId(stripeAccountId: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.stripeAccountId, stripeAccountId));
    return u;
  },

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return u;
  },

  async createNdisClaim(data: InsertNdisClaim): Promise<NdisClaim> {
    const [c] = await db.insert(ndisClaims).values(data).returning();
    return c;
  },

  async getNdisClaims(filters?: { participantId?: string; invoiceId?: string; limit?: number }): Promise<NdisClaim[]> {
    const conditions = [];
    if (filters?.participantId) conditions.push(eq(ndisClaims.participantId, filters.participantId));
    if (filters?.invoiceId) conditions.push(eq(ndisClaims.invoiceId, filters.invoiceId));
    let query = db.select().from(ndisClaims).$dynamic();
    if (conditions.length) query = query.where(and(...conditions));
    return query.orderBy(desc(ndisClaims.submittedAt)).limit(filters?.limit ?? 100);
  },

  async wasWebhookProcessed(eventId: string): Promise<boolean> {
    const [row] = await db.select().from(stripeWebhookEvents).where(eq(stripeWebhookEvents.eventId, eventId));
    return !!row;
  },

  async recordWebhookEvent(eventId: string, eventType: string): Promise<void> {
    try {
      await db.insert(stripeWebhookEvents).values({ eventId, eventType });
    } catch {
      // unique conflict is fine
    }
  },

  async claimWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
    const inserted = await db
      .insert(stripeWebhookEvents)
      .values({ eventId, eventType })
      .onConflictDoNothing({ target: stripeWebhookEvents.eventId })
      .returning({ id: stripeWebhookEvents.id });
    return inserted.length > 0;
  },

  async getInvoicesAwaitingAutoDebit(): Promise<(Invoice & { user?: User })[]> {
    const rows = await db.select().from(invoices).where(eq(invoices.status, "draft"));
    const out: (Invoice & { user?: User })[] = [];
    for (const inv of rows) {
      const [u] = await db.select().from(users).where(eq(users.id, inv.participantId));
      if (u?.autoDebitEnabled && u.defaultBecsPaymentMethodId) {
        out.push({ ...inv, user: u });
      }
    }
    return out;
  },
};
