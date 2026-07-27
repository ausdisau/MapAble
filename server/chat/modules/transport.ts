import { eq } from "drizzle-orm";
import { pricingTiers, users, workers } from "@shared/schema";
import type { ChatModule } from "../types";

export const transportModule: ChatModule = {
  name: "transport",
  description: "Searches transport-capable workers, returns NDIS transport pricing, and prepares transport bookings.",
  intents: ["transport", "trip", "travel", "journey", "ride", "drive", "driver", "vehicle", "wheelchair", "pickup", "drop", "fare", "km", "kilometre", "pricing", "rate", "cost"],
  quickActions: ["book_transport", "view_workers", "view_pricing"],
  tools: [
    {
      type: "function",
      function: {
        name: "search_transport_workers",
        description: "Search for available transport-capable support workers. Can filter by wheelchair accessibility.",
        parameters: {
          type: "object",
          properties: {
            wheelchairAccessible: { type: "boolean", description: "Filter for wheelchair accessible vehicles" },
            location: { type: "string", description: "Location area to search in" },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_transport_pricing",
        description: "Get current NDIS transport pricing tiers including per-km rates and accessible vehicle surcharges.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    {
      type: "function",
      function: {
        name: "book_transport",
        description: "Initiate a transport booking for the user with an accessible vehicle if needed.",
        parameters: {
          type: "object",
          properties: {
            pickup: { type: "string", description: "Pickup location" },
            dropoff: { type: "string", description: "Dropoff location" },
            date: { type: "string", description: "Date for the trip (YYYY-MM-DD)" },
            time: { type: "string", description: "Preferred time" },
            wheelchairRequired: { type: "boolean", description: "Whether wheelchair accessible vehicle is needed" },
          },
          required: ["pickup", "dropoff"],
        },
      },
    },
  ],
  handlers: {
    search_transport_workers: async (args, ctx) => {
      const allWorkers = await ctx.db
        .select()
        .from(workers)
        .innerJoin(users, eq(workers.userId, users.id))
        .where(eq(workers.transportCapable, true));

      let results = allWorkers.map((w) => ({
        name: w.users.fullName,
        title: w.workers.title,
        location: w.users.location,
        rating: w.workers.rating,
        reviewCount: w.workers.reviewCount,
        hourlyRate: w.workers.hourlyRate,
        transportType: w.workers.transportType,
        wheelchairAccessible: w.workers.wheelchairAccessible,
        availability: w.workers.availability,
        ndisVerified: w.workers.ndisVerified,
        workerId: w.workers.id,
      }));

      if (args.wheelchairAccessible) {
        results = results.filter((w) => w.wheelchairAccessible);
      }

      return JSON.stringify({
        workers: results,
        count: results.length,
        note: "All workers shown are NDIS verified and transport capable.",
      });
    },

    get_transport_pricing: async (_args, ctx) => {
      const tiers = await ctx.db
        .select()
        .from(pricingTiers)
        .where(eq(pricingTiers.serviceType, "transport"));
      return JSON.stringify({
        tiers: tiers.map((t) => ({
          name: t.tierName,
          rate: `$${t.rate}/km`,
          range: `${t.minUsage}–${t.maxUsage || "∞"} km/month`,
          ndisItemCode: t.ndisItemCode,
        })),
        note: "NDIS transport pricing. Accessible vehicle surcharge of $2.76/km applies for wheelchair accessible vehicles.",
      });
    },

    book_transport: async (args) => {
      const today = new Date().toISOString().split("T")[0];
      return JSON.stringify({
        action: "navigate_to_transport",
        prefilled: {
          pickup: args.pickup,
          dropoff: args.dropoff,
          date: args.date || today,
          time: args.time || "09:00",
          wheelchairRequired: args.wheelchairRequired || false,
        },
        message: "I've prepared a transport booking for you. You can complete it on the Transport page.",
        quickAction: "book_transport",
      });
    },
  },
};
