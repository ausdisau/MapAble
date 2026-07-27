import type { ChatModule } from "../types";

export const billingModule: ChatModule = {
  name: "billing",
  description: "Shows pending invoices and the user's NDIS budget summary across categories.",
  intents: ["invoice", "payment", "pay", "owe", "bill", "billing", "budget", "allocation", "fund", "spend", "spent", "remaining", "claim"],
  quickActions: ["pay_invoice", "check_budget"],
  tools: [
    {
      type: "function",
      function: {
        name: "get_pending_invoices",
        description: "Retrieve the user's pending/unpaid invoices including amounts, periods, and status.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    {
      type: "function",
      function: {
        name: "get_budget_summary",
        description: "Get the user's NDIS budget summary showing allocated vs used amounts across all budget categories (daily living, transport, capacity building).",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
  ],
  handlers: {
    get_pending_invoices: async (_args, ctx) => {
      const pendingInvoices = await ctx.storage.getPendingInvoices(ctx.userId);
      if (pendingInvoices.length === 0) {
        return JSON.stringify({
          message: "No pending invoices. You're all caught up!",
          invoices: [],
        });
      }

      return JSON.stringify({
        invoices: pendingInvoices.map((inv) => ({
          id: inv.id,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
          totalAmount: `$${Number(inv.totalAmount).toFixed(2)}`,
          ndisClaimable: inv.ndisClaimable ? `$${Number(inv.ndisClaimable).toFixed(2)}` : null,
          status: inv.status,
          generatedAt: inv.generatedAt,
        })),
        totalOwing: `$${pendingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0).toFixed(2)}`,
        count: pendingInvoices.length,
        quickAction: "pay_invoice",
      });
    },

    get_budget_summary: async (_args, ctx) => {
      const budgets = await ctx.storage.getParticipantBudgets(ctx.userId);
      if (budgets.length === 0) {
        return JSON.stringify({
          message: "No NDIS budget allocations found for your account.",
          budgets: [],
        });
      }

      const budgetSummary = budgets.map((b) => {
        const allocated = Number(b.totalAllocated);
        const used = Number(b.totalUsed);
        const remaining = allocated - used;
        const percentUsed = allocated > 0 ? (used / allocated) * 100 : 0;
        return {
          category: b.category,
          allocated: `$${allocated.toFixed(2)}`,
          used: `$${used.toFixed(2)}`,
          remaining: `$${remaining.toFixed(2)}`,
          percentUsed: `${percentUsed.toFixed(0)}%`,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          nearLimit: percentUsed >= 80,
        };
      });

      return JSON.stringify({
        budgets: budgetSummary,
        quickAction: "check_budget",
      });
    },
  },
};
