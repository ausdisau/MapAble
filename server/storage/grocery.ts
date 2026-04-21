import {
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type Booking, type InsertBooking,
  type Job, type InsertJob,
  type TransportRequest, type InsertTransportRequest,
  type Message, type InsertMessage,
  type PricingTier, type InsertPricingTier,
  type ServiceSession, type InsertServiceSession,
  type TransportTrip, type InsertTransportTrip,
  type Invoice, type InsertInvoice,
  type Review, type InsertReview,
  type ParticipantBudget, type InsertParticipantBudget,
  type AccessContextProfile, type InsertAccessContextProfile,
  type CommunityReport, type InsertCommunityReport,
  type WorkerAvailability, type InsertWorkerAvailability,
  type WorkerBlockout, type InsertWorkerBlockout,
  type Shift, type InsertShift,
  type NdisPlanCache, type InsertNdisPlanCache,
  type GroceryProduct, type InsertGroceryProduct,
  type GroceryOrder, type InsertGroceryOrder,
  type GroceryOrderItem, type InsertGroceryOrderItem,
  users, workers, bookings, jobs, transportRequests, messages,
  pricingTiers, serviceSessions, transportTrips, invoices, reviews, participantBudgets,
  accessContextProfiles, communityReports,
  workerAvailability, workerBlockouts, shifts, ndisPlanCache,
  groceryProducts, groceryOrders, groceryOrderItems,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, gte, lte, inArray, isNotNull } from "drizzle-orm";

export const groceryStorage = {
  async getGroceryProducts(filters?: { category?: string; search?: string }): Promise<GroceryProduct[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(groceryProducts.category, filters.category as GroceryProduct["category"]));
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push(sql`LOWER(${groceryProducts.name}) LIKE ${term}`);
    }
    if (conditions.length === 0) {
      return db.select().from(groceryProducts).orderBy(groceryProducts.name);
    }
    return db.select().from(groceryProducts).where(and(...conditions)).orderBy(groceryProducts.name);
  },

  async getGroceryProduct(id: string): Promise<GroceryProduct | undefined> {
    const [p] = await db.select().from(groceryProducts).where(eq(groceryProducts.id, id));
    return p;
  },

  async createGroceryProduct(data: InsertGroceryProduct): Promise<GroceryProduct> {
      const [p] = await db.insert(groceryProducts).values(data).returning();
      return p;
    },

    async upsertSupplierGroceryProduct(data: InsertGroceryProduct): Promise<GroceryProduct> {
      if (!data.supplierProductId) {
        return this.createGroceryProduct(data);
      }
      const [p] = await db
        .insert(groceryProducts)
        .values(data)
        .onConflictDoUpdate({
          target: [groceryProducts.supplierSource, groceryProducts.supplierProductId],
          set: {
            name: data.name,
            brand: data.brand,
            category: data.category,
            price: data.price,
            unit: data.unit,
            description: data.description,
            image: data.image,
            inStock: data.inStock,
            supplierUrl: data.supplierUrl,
            priceSource: data.priceSource,
            lastSyncedAt: data.lastSyncedAt,
          },
        })
        .returning();
      return p;
    },

    async deleteGroceryProductsBySource(source: string): Promise<number> {
      const deleted = await db
        .delete(groceryProducts)
        .where(eq(groceryProducts.supplierSource, source))
        .returning({ id: groceryProducts.id });
      return deleted.length;
    },

    async getGroceryCatalogStatus(): Promise<{ productCount: number; bySource: Record<string, number>; lastSyncedAt: string | null }> {
      const products = await db.select().from(groceryProducts);
      const bySource: Record<string, number> = {};
      let lastSyncedAt: string | null = null;
      for (const product of products) {
        const source = product.supplierSource || "seed";
        bySource[source] = (bySource[source] || 0) + 1;
        if (product.lastSyncedAt) {
          const value = product.lastSyncedAt.toISOString();
          if (!lastSyncedAt || value > lastSyncedAt) lastSyncedAt = value;
        }
      }
      return { productCount: products.length, bySource, lastSyncedAt };
    },

  async createGroceryOrder(
    order: InsertGroceryOrder,
    items: { productId: string; quantity: number; unitPrice: string }[]
  ): Promise<GroceryOrder> {
    const [created] = await db.insert(groceryOrders).values(order).returning();
    if (items.length > 0) {
      await db.insert(groceryOrderItems).values(
        items.map((i) => ({
          orderId: created.id,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      );
    }
    return created;
  },

  async getGroceryOrders(participantId: string): Promise<GroceryOrder[]> {
    return db
      .select()
      .from(groceryOrders)
      .where(eq(groceryOrders.participantId, participantId))
      .orderBy(desc(groceryOrders.createdAt));
  },

  async getGroceryOrder(id: string): Promise<(GroceryOrder & { items: (GroceryOrderItem & { product?: GroceryProduct })[] }) | undefined> {
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(groceryOrderItems).where(eq(groceryOrderItems.orderId, id));
    const itemsWithProducts = await Promise.all(
      items.map(async (it) => {
        const product = await this.getGroceryProduct(it.productId);
        return { ...it, product };
      })
    );
    return { ...order, items: itemsWithProducts };
  },

  async updateGroceryOrderStatus(id: string, status: string): Promise<GroceryOrder | undefined> {
    const [order] = await db
      .update(groceryOrders)
      .set({ status: status as GroceryOrder["status"] })
      .where(eq(groceryOrders.id, id))
      .returning();
    return order;
  },

  async updateGroceryOrderPayment(id: string, data: { stripePaymentIntentId?: string; paymentStatus?: string }): Promise<GroceryOrder | undefined> {
    const setData: Record<string, any> = {};
    if (data.stripePaymentIntentId !== undefined) setData.stripePaymentIntentId = data.stripePaymentIntentId;
    if (data.paymentStatus !== undefined) setData.paymentStatus = data.paymentStatus;
    const [order] = await db.update(groceryOrders).set(setData).where(eq(groceryOrders.id, id)).returning();
    return order;
  },

  async getActiveGroceryOrders(participantId: string): Promise<GroceryOrder[]> {
    return db
      .select()
      .from(groceryOrders)
      .where(
        and(
          eq(groceryOrders.participantId, participantId),
          inArray(groceryOrders.status, ["placed", "confirmed", "shopping", "out_for_delivery"])
        )
      )
      .orderBy(desc(groceryOrders.createdAt));
  }
};
