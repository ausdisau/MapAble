import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, json, serial, uuid } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  
  export const groceryOrderStatusEnum = pgEnum("grocery_order_status", [
  "placed",
  "confirmed",
  "shopping",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const groceryCategoryEnum = pgEnum("grocery_category", [
  "fresh_produce",
  "pantry",
  "dairy",
  "frozen",
  "bakery",
  "meat_seafood",
  "beverages",
  "household",
  "personal_care",
]);

export const groceryProducts = pgTable("grocery_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  brand: varchar("brand"),
  category: groceryCategoryEnum("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  description: text("description"),
  image: text("image"),
  inStock: boolean("in_stock").default(true),
  supplierSource: varchar("supplier_source").notNull().default("seed"),
  supplierProductId: varchar("supplier_product_id"),
  supplierUrl: varchar("supplier_url"),
  priceSource: varchar("price_source").notNull().default("manual"),
  lastSyncedAt: timestamp("last_synced_at"),
});

export const groceryOrders = pgTable("grocery_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  status: groceryOrderStatusEnum("status").notNull().default("placed"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryTimePreference: text("delivery_time_preference"),
  accessNeeds: text("access_needs"),
  deliveryNotes: text("delivery_notes"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").default("unpaid"),
  workerId: varchar("worker_id"),
  shoppingList: text("shopping_list"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groceryOrderItems = pgTable("grocery_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertGroceryProductSchema = createInsertSchema(groceryProducts).omit({ id: true });
export const insertGroceryOrderSchema = createInsertSchema(groceryOrders).omit({
  id: true,
  createdAt: true,
  status: true,
  stripePaymentIntentId: true,
  paymentStatus: true,
});
export const insertGroceryOrderItemSchema = createInsertSchema(groceryOrderItems).omit({ id: true });

export type InsertGroceryProduct = z.infer<typeof insertGroceryProductSchema>;
export type GroceryProduct = typeof groceryProducts.$inferSelect;
export type InsertGroceryOrder = z.infer<typeof insertGroceryOrderSchema>;
export type GroceryOrder = typeof groceryOrders.$inferSelect;
export type InsertGroceryOrderItem = z.infer<typeof insertGroceryOrderItemSchema>;
export type GroceryOrderItem = typeof groceryOrderItems.$inferSelect;
  