import type { ChatModule } from "../types";

export const groceryModule: ChatModule = {
  name: "grocery",
  description: "Searches the grocery catalogue, lists grocery orders, opens the grocery shop, and reviews the user's cart.",
  intents: ["grocer", "groceries", "shopping", "shopping list", "food", "delivery", "cart", "order", "produce", "pantry", "supermarket"],
  quickActions: ["view_groceries", "view_grocery_orders"],
  tools: [
    {
      type: "function",
      function: {
        name: "search_grocery_products",
        description: "Search the MapAble grocery catalogue for items the user can order for delivery, optionally filtered by category and a search term.",
        parameters: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search term to match product name" },
            category: {
              type: "string",
              enum: ["fresh_produce", "pantry", "dairy", "frozen", "bakery", "meat_seafood", "beverages", "household", "personal_care"],
              description: "Optional category filter",
            },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_grocery_orders",
        description: "Retrieve the user's grocery orders, including their status and totals. Use 'active' filter to only show in-progress orders.",
        parameters: {
          type: "object",
          properties: {
            activeOnly: { type: "boolean", description: "Only return orders that are still in progress (placed/confirmed/shopping/out_for_delivery)" },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "navigate_to_groceries",
        description: "Direct the user to the grocery shopping page, optionally with a category or search prefilled. Use this when they ask to order or browse groceries.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "Optional category to prefill" },
            search: { type: "string", description: "Optional search term to prefill" },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "view_grocery_cart",
        description: "When the user asks 'what's in my cart' or wants to review/edit cart contents, call this. The cart is stored in the user's browser; this tool returns guidance and a navigation hint to open the checkout page where the cart is shown.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
  ],
  handlers: {
    search_grocery_products: async (args, ctx) => {
      const products = await ctx.storage.getGroceryProducts({
        category: args.category || undefined,
        search: args.search || undefined,
      });
      return JSON.stringify({
        products: products.slice(0, 20).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          price: `$${Number(p.price).toFixed(2)}`,
          inStock: p.inStock,
        })),
        count: products.length,
        quickAction: "view_groceries",
      });
    },

    get_grocery_orders: async (args, ctx) => {
      const orders = args.activeOnly
        ? await ctx.storage.getActiveGroceryOrders(ctx.userId)
        : await ctx.storage.getGroceryOrders(ctx.userId);
      if (orders.length === 0) {
        return JSON.stringify({
          message: args.activeOnly
            ? "No active grocery orders right now."
            : "No grocery orders yet.",
          orders: [],
          quickAction: "view_groceries",
        });
      }
      return JSON.stringify({
        orders: orders.map((o) => ({
          id: o.id,
          status: o.status,
          total: `$${Number(o.totalAmount).toFixed(2)}`,
          paymentStatus: o.paymentStatus,
          deliveryAddress: o.deliveryAddress,
          createdAt: o.createdAt,
          workerAssisted: !!o.workerId,
        })),
        count: orders.length,
        quickAction: "view_grocery_orders",
      });
    },

    navigate_to_groceries: async (args) => {
      return JSON.stringify({
        action: "navigate_to_groceries",
        prefilled: {
          category: args.category || null,
          search: args.search || null,
        },
        message: "I've prepared the grocery shop for you. You can finish browsing and place an order on the Groceries page.",
        quickAction: "view_groceries",
      });
    },

    view_grocery_cart: async (_args, ctx) => {
      const cart = ctx.clientContext?.groceryCart || [];
      if (cart.length === 0) {
        return JSON.stringify({
          message: "Your grocery cart is empty. Browse the Groceries page to add items.",
          cart: [],
          itemCount: 0,
          quickAction: "view_groceries",
        });
      }
      let total = 0;
      const items = cart.map((c) => {
        const unitPrice = c.price != null ? Number(c.price) : 0;
        const lineTotal = unitPrice * c.quantity;
        total += lineTotal;
        return {
          productId: c.productId,
          name: c.name || c.productId,
          unit: c.unit,
          quantity: c.quantity,
          unitPrice: c.price != null ? `$${unitPrice.toFixed(2)}` : null,
          lineTotal: `$${lineTotal.toFixed(2)}`,
        };
      });
      return JSON.stringify({
        cart: items,
        itemCount: cart.reduce((s, c) => s + c.quantity, 0),
        estimatedTotal: `$${total.toFixed(2)}`,
        quickAction: "view_groceries",
        navigatesTo: "/groceries/checkout",
      });
    },
  },
};
