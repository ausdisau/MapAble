import { eq } from "drizzle-orm";
import { users, workers } from "@shared/schema";
import type { ChatModule } from "../types";

export const shiftsModule: ChatModule = {
  name: "shifts",
  description: "Lists the user's upcoming shifts and books new shifts (with NDIS budget checks).",
  intents: ["shift", "schedule", "book", "appointment", "roster", "worker", "carer", "support session", "upcoming"],
  quickActions: ["view_shifts"],
  tools: [
    {
      type: "function",
      function: {
        name: "get_upcoming_shifts",
        description: "Retrieve the user's upcoming scheduled or confirmed shifts including worker name, date, time, and NDIS category.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    {
      type: "function",
      function: {
        name: "book_shift",
        description: "Book a new shift for the user with a specific worker on a given date and time. Always confirm details with the user before calling this tool.",
        parameters: {
          type: "object",
          properties: {
            workerId: { type: "string", description: "ID of the worker to book the shift with" },
            date: { type: "string", description: "Date for the shift (YYYY-MM-DD)" },
            startTime: { type: "string", description: "Start time (HH:MM format, 24h)" },
            endTime: { type: "string", description: "End time (HH:MM format, 24h)" },
            ndisCategory: { type: "string", description: "NDIS category for this shift (e.g. daily_living, transport, capacity_building)" },
            notes: { type: "string", description: "Any additional notes for the shift" },
          },
          required: ["workerId", "date", "startTime", "endTime"],
        },
      },
    },
  ],
  handlers: {
    get_upcoming_shifts: async (_args, ctx) => {
      const upcomingShifts = await ctx.storage.getUpcomingShifts(ctx.userId);
      if (upcomingShifts.length === 0) {
        return JSON.stringify({
          message: "No upcoming shifts found.",
          shifts: [],
          quickAction: "view_shifts",
        });
      }

      const shiftsWithWorkers = await Promise.all(
        upcomingShifts.map(async (shift) => {
          const workerRows = await ctx.db
            .select()
            .from(workers)
            .innerJoin(users, eq(workers.userId, users.id))
            .where(eq(workers.id, shift.workerId));
          const workerInfo = workerRows[0];
          return {
            id: shift.id,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            workerName: workerInfo?.users.fullName || "Unknown worker",
            ndisCategory: shift.ndisCategory,
            ndisGoal: shift.ndisGoal,
            status: shift.status,
            notes: shift.notes,
          };
        })
      );

      return JSON.stringify({
        shifts: shiftsWithWorkers,
        count: shiftsWithWorkers.length,
        quickAction: "view_shifts",
      });
    },

    book_shift: async (args, ctx) => {
      if (!args.workerId || !args.date || !args.startTime || !args.endTime) {
        return JSON.stringify({
          error: "Missing required fields: workerId, date, startTime, and endTime are all required.",
        });
      }

      const budgets = await ctx.storage.getParticipantBudgets(ctx.userId);
      const category = args.ndisCategory || "daily_living";
      const relevantBudget = budgets.find((b) => b.category === category);
      let budgetWarning: string | null = null;

      if (relevantBudget) {
        const used = Number(relevantBudget.totalUsed);
        const allocated = Number(relevantBudget.totalAllocated);
        const percentUsed = allocated > 0 ? (used / allocated) * 100 : 0;
        if (percentUsed >= 100) {
          return JSON.stringify({
            error: `Cannot book shift: Your ${category.replace("_", " ")} budget is fully used ($${used.toFixed(2)} of $${allocated.toFixed(2)}).`,
            quickAction: "check_budget",
          });
        }
        if (percentUsed >= 80) {
          budgetWarning = `Warning: Your ${category.replace("_", " ")} budget is ${percentUsed.toFixed(0)}% used ($${used.toFixed(2)} of $${allocated.toFixed(2)}). This shift will further reduce your remaining budget.`;
        }
      }

      const shift = await ctx.storage.createShift({
        participantId: ctx.userId,
        workerId: args.workerId,
        date: args.date,
        startTime: args.startTime,
        endTime: args.endTime,
        ndisCategory: args.ndisCategory || null,
        ndisGoal: null,
        status: "scheduled",
        notes: args.notes || null,
        recurrenceRule: null,
        serviceSessionId: null,
      });

      const workerRows = await ctx.db
        .select()
        .from(workers)
        .innerJoin(users, eq(workers.userId, users.id))
        .where(eq(workers.id, args.workerId));
      const workerInfo = workerRows[0];

      return JSON.stringify({
        success: true,
        shiftId: shift.id,
        workerName: workerInfo?.users.fullName || "Unknown worker",
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        message: `Shift booked successfully for ${shift.date} from ${shift.startTime} to ${shift.endTime}.`,
        budgetWarning,
        quickAction: "view_shifts",
      });
    },
  },
};
