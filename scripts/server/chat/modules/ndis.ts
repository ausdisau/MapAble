import type { ChatModule } from "../types";

export const ndisModule: ChatModule = {
  name: "ndis",
  description: "Retrieves the user's cached NDIS plan goals.",
  intents: ["ndis", "plan", "goal", "goals", "planner", "plan review"],
  tools: [
    {
      type: "function",
      function: {
        name: "get_ndis_plan_goals",
        description: "Retrieve the user's NDIS plan goals from the cached plan data.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
  ],
  handlers: {
    get_ndis_plan_goals: async (_args, ctx) => {
      const planCache = await ctx.storage.getNdisPlanGoals(ctx.userId);
      if (!planCache || !planCache.goals) {
        return JSON.stringify({
          message: "No NDIS plan goals found. Your plan data may not have been synced yet.",
          goals: [],
        });
      }

      return JSON.stringify({
        goals: planCache.goals,
        planData: planCache.planData,
        fetchedAt: planCache.fetchedAt,
        note: "This data is cached from the NDIS API. Contact your NDIS planner for the most current information.",
      });
    },
  },
};
