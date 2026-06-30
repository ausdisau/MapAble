import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { getStripe, stripeEnabled } from "../stripe";
import {
  describeSupplierLocation,
  getEffectiveSupplierLocation,
  getLastSyncMeta,
  getSupplierLimit,
  getSupplierProvider,
  syncGroceryCatalog,
} from "../grocery-supplier";
import { getWorkerIdForUser, requireAuth } from "./shared";

export function registerGroceryRoutes(app: Express) {
  app.get("/api/grocery/products", async (req, res) => {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const products = await storage.getGroceryProducts({ category, search });
      res.json(products);
    } catch (e) {
      console.error("List grocery products failed:", e);
      res.status(500).json({ message: "Failed to load products" });
    }
  });

  app.get("/api/grocery/products/:id", async (req, res) => {
    const product = await storage.getGroceryProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.get("/api/grocery/supplier/status", requireAuth, async (req, res) => {
    try {
      const requester = await storage.getUser(req.session.userId!);
      if (!requester || requester.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const status = await storage.getGroceryCatalogStatus();
      const provider = getSupplierProvider();
      const lastSync = getLastSyncMeta();
      const isComposite = ["composite", "firstavailable", "first-available"].includes(provider);
      // Prefer the location actually used by the latest in-process sync; fall
      // back to the effective location (config + provider defaults) the next
      // sync would use for the active provider.
      const configuredLocation = isComposite ? null : getEffectiveSupplierLocation(provider);
      const location = lastSync ? lastSync.location : configuredLocation;
      const locationLabel = lastSync
        ? lastSync.locationLabel
        : configuredLocation
          ? describeSupplierLocation(configuredLocation)
          : null;
      res.json({
        ...status,
        provider,
        limit: getSupplierLimit(),
        location,
        locationLabel,
        lastSyncProvider: lastSync?.provider ?? null,
        lastSyncAt: lastSync?.syncedAt ?? null,
      });
    } catch (e) {
      console.error("Grocery supplier status failed:", e);
      res.status(500).json({ message: "Failed to load supplier status" });
    }
  });

  app.post("/api/grocery/supplier/sync", requireAuth, async (req, res) => {
    try {
      const requester = await storage.getUser(req.session.userId!);
      if (!requester || requester.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const limit = req.body?.limit === undefined ? undefined : z.number().int().min(1).max(100).parse(req.body.limit);
      const replaceSeed = req.body?.replaceSeed === undefined ? undefined : z.boolean().parse(req.body.replaceSeed);
      const result = await syncGroceryCatalog({ limit, replaceSeed });
      res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      console.error("Grocery supplier sync failed:", e);
      res.status(502).json({ message: e instanceof Error ? e.message : "Supplier sync failed" });
    }
  });

  const createGroceryOrderSchema = z.object({
    deliveryAddress: z.string().min(1),
    deliveryTimePreference: z.string().optional(),
    accessNeeds: z.string().optional(),
    deliveryNotes: z.string().optional(),
    workerId: z.string().optional(),
    shoppingList: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    })).default([]),
  }).refine(
    (d) => d.items.length > 0 || (d.shoppingList && d.shoppingList.trim().length > 0),
    { message: "Either cart items or a shopping list is required" },
  );

  app.post("/api/grocery/orders", requireAuth, async (req, res) => {
    try {
      const data = createGroceryOrderSchema.parse(req.body);
      const userId = req.session.userId!;

      const productMap = new Map<string, { id: string; price: string; name: string }>();
      let total = 0;
      for (const item of data.items) {
        const product = await storage.getGroceryProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product not found: ${item.productId}` });
        }
        if (product.inStock === false) {
          return res.status(400).json({ message: `Product out of stock: ${product.name}` });
        }
        productMap.set(item.productId, { id: product.id, price: product.price, name: product.name });
        total += Number(product.price) * item.quantity;
      }

      const order = await storage.createGroceryOrder(
        {
          participantId: userId,
          deliveryAddress: data.deliveryAddress,
          deliveryTimePreference: data.deliveryTimePreference || null,
          accessNeeds: data.accessNeeds || null,
          deliveryNotes: data.deliveryNotes || null,
          totalAmount: total.toFixed(2),
          workerId: data.workerId || null,
          shoppingList: data.shoppingList || null,
        },
        data.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: productMap.get(i.productId)!.price,
        }))
      );

      res.status(201).json(order);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      console.error("Create grocery order failed:", e);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/grocery/orders", requireAuth, async (req, res) => {
    const orders = await storage.getGroceryOrders(req.session.userId!);
    res.json(orders);
  });

  app.get("/api/grocery/orders/:id", requireAuth, async (req, res) => {
    const order = await storage.getGroceryOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.participantId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(order);
  });

  // Hard delete an order (and its items). Restricted to the owner participant or admin.
  // Used by automated tests for deterministic cleanup.
  app.delete("/api/grocery/orders/:id", requireAuth, async (req, res) => {
    const existing = await storage.getGroceryOrder(req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found" });
    const requester = await storage.getUser(req.session.userId!);
    if (!requester) return res.status(401).json({ message: "Not authenticated" });
    const isOwner = existing.participantId === req.session.userId;
    const isAdmin = requester.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this order" });
    }
    const ok = await storage.deleteGroceryOrder(req.params.id);
    if (!ok) return res.status(404).json({ message: "Order not found" });
    res.json({ ok: true });
  });

  app.patch("/api/grocery/orders/:id/status", requireAuth, async (req, res) => {
    const { status } = req.body;
    const allowed = ["placed", "confirmed", "shopping", "out_for_delivery", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const existing = await storage.getGroceryOrder(req.params.id);
    if (!existing) return res.status(404).json({ message: "Order not found" });

    const requester = await storage.getUser(req.session.userId!);
    if (!requester) return res.status(401).json({ message: "Not authenticated" });

    const isOwner = existing.participantId === req.session.userId;
    const requesterWorkerId = await getWorkerIdForUser(req.session.userId!);
    const isAssignedWorker = !!existing.workerId && !!requesterWorkerId && existing.workerId === requesterWorkerId;
    const isAdmin = requester.role === "admin";

    if (!isOwner && !isAssignedWorker && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (isOwner && !isAdmin && !isAssignedWorker) {
      if (status !== "cancelled") {
        return res.status(403).json({
          message: "Participants may only cancel an order. Fulfillment status is updated by the assigned worker or admin.",
        });
      }
      if (["out_for_delivery", "delivered", "cancelled"].includes(existing.status)) {
        return res.status(400).json({ message: `Cannot cancel an order in ${existing.status} state` });
      }
    }

    const order = await storage.updateGroceryOrderStatus(req.params.id, status);

    // Fire-and-forget participant notification on real status transitions.
    // Skip if the new status equals the old one (no-op update). Notification
    // failures must never block the status update from succeeding.
    if (order && existing.status !== status) {
      (async () => {
        try {
          const participant = await storage.getUser(order.participantId);
          if (!participant) return;
          const { notifyGroceryOrderStatus } = await import("../notifications");
          const result = await notifyGroceryOrderStatus(participant, order);
          if (result.attempted && !result.emailed) {
            console.warn(`[notifications] order ${order.id} status=${status} not delivered: ${result.reason}`);
          }
        } catch (e) {
          console.warn("[notifications] dispatch threw:", e instanceof Error ? e.message : e);
        }
      })();
    }

    res.json(order);
  });

  app.post("/api/grocery/orders/:id/pay", requireAuth, async (req, res) => {
    if (!stripeEnabled()) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }
    const order = await storage.getGroceryOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (Number(order.totalAmount) <= 0) {
      return res.status(400).json({ message: "Order has no payable amount yet. The worker will add items first." });
    }
    if (order.participantId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (order.paymentStatus === "succeeded") {
      return res.status(400).json({ message: "Order already paid" });
    }

    if (order.stripePaymentIntentId) {
      const existingPi = await getStripe().paymentIntents.retrieve(order.stripePaymentIntentId);
      if (existingPi.status !== "canceled" && existingPi.status !== "succeeded") {
        return res.json({ clientSecret: existingPi.client_secret, paymentIntentId: existingPi.id });
      }
    }

    const user = await storage.getUser(order.participantId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        name: user.fullName,
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
    }

    const amountCents = Math.round(Number(order.totalAmount) * 100);
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      customer: stripeCustomerId,
      payment_method_types: ["card", "link"],
      metadata: {
        groceryOrderId: order.id,
        participantId: order.participantId,
        type: "grocery_order",
      },
    });

    await storage.updateGroceryOrderPayment(order.id, {
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  });
}
