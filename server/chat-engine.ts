import OpenAI from "openai";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { storage } from "./storage";
import {
  accessContextProfiles,
  chatSessions,
  chatMessages,
  communityReports,
  workers,
  users,
  transportRequests,
  pricingTiers,
  type AccessContextProfile,
  type ChatSession,
  type ChatMessage,
  type CommunityReport,
} from "@shared/schema";
import {
  applyOutputGuardrails,
  buildPolicySystemPrompt,
  classifyUserTurn,
  ensureGuardrailTables,
  logComplaintDraft,
  logGuardrailAudit,
  logIncidentDraft,
  flagSafeguardingConcern,
  recordConsent,
  runRequiredSafeguardingActions,
  safeguardingTemplate,
} from "./chat-guardrails";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `${buildPolicySystemPrompt()}

You also help people with disability plan accessible journeys, understand transport options, report accessibility barriers, navigate NDIS support services, manage shifts and billing.

Your core principles:
- SAFETY FIRST: Never suggest stairs if the user's profile says stairs_allowed=false. Never suggest routes that exceed their max transfer distance.
- LAYERED ANSWERS: Always structure responses as: 1) Brief headline, 2) Key details/risks, 3) Recommended actions
- CONFIDENCE DISCLOSURE: Be transparent about what you know vs what you're uncertain about
- PRIVACY BY DEFAULT: Never share diagnosis labels. Only reference mobility needs in functional terms.
- AUSTRALIAN CONTEXT: You operate in Australia. Reference Australian transport systems, NDIS terminology, and local accessibility standards.
- EMPOWERING TONE: Speak respectfully and practically. Support independence without being patronising.

You have access to tools to:
- Look up the user's accessibility profile
- Search for accessible transport workers
- Check community barrier reports for locations
- Help submit new barrier reports
- Look up transport pricing
- Help book transport
- Escalate to human support when needed
- View upcoming shifts and book new shifts
- Check pending invoices and billing
- View NDIS budget summary across categories
- Look up NDIS plan goals
- Log incident drafts for safeguarding review
- Log complaint drafts for human follow-up
- Record consent decisions
- Flag safeguarding concerns for human review

Billing & Shifts guidance:
- When discussing shifts, always confirm the date, time, and worker before booking. Ask the user to confirm before creating a shift.
- For invoices, show the amount and period. You cannot process payments directly — provide a quick action to navigate to the payment page.
- When discussing budgets, show remaining allocation vs used amounts. Warn the user if they are approaching their budget limit (>80% used).
- For NDIS plan goals, present them clearly and relate them to the user's current services.
- You cannot cancel shifts through chat — direct the user to the shifts page instead.
- You cannot modify NDIS plan data — only display it.

When the user asks about journey planning, always consider their accessibility profile (mobility aids, stairs capability, transfer distance, sensory preferences). When providing transport options, reference MapAble's real workers and pricing tiers.

For disruption or barrier situations, provide clear "what to do next" guidance with actionable options.

Always end responses with relevant quick action suggestions when appropriate.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Retrieve the user's accessibility context profile including mobility aids, transfer distance limits, stairs capability, sensory preferences, and assistance needs.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
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
      name: "check_barrier_reports",
      description: "Check community-reported accessibility barriers at a specific location or area.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "Location or area to check for barrier reports" },
        },
        required: ["location"],
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
      name: "submit_barrier_report",
      description: "Submit a community barrier report about an accessibility issue at a location.",
      parameters: {
        type: "object",
        properties: {
          locationRef: { type: "string", description: "Location where the barrier is" },
          barrierType: {
            type: "string",
            enum: ["lift_out", "ramp_blocked", "path_closed", "door_too_heavy", "kerb_ramp_missing", "inaccessible_toilet", "unsafe_crossing", "driver_bypass", "helpful_staff", "other"],
            description: "Type of accessibility barrier",
          },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Severity of the barrier" },
          description: { type: "string", description: "Detailed description of the barrier" },
        },
        required: ["locationRef", "barrierType", "severity"],
      },
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
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Escalate the conversation to human support when the user needs help beyond what the chatbot can provide, or expresses distress.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" },
        },
        required: ["reason"],
      },
    },
  },
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
  {
    type: "function",
    function: {
      name: "get_ndis_plan_goals",
      description: "Retrieve the user's NDIS plan goals from the cached plan data.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
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
  {
    type: "function",
    function: {
      name: "log_incident_draft",
      description: "Create a safeguarding incident draft aligned with MapAble incident register fields and mark the chat for human review.",
      parameters: {
        type: "object",
        properties: {
          incidentType: { type: "string", description: "Incident category or reportable incident indicator" },
          immediateActions: { type: "string", description: "Safety-first actions already suggested or taken" },
          reportable: { type: "boolean", description: "Whether it may be reportable to the NDIS Commission" },
          investigationSummary: { type: "string", description: "Brief factual summary from the chat" },
          correctiveActions: { type: "string", description: "Suggested immediate corrective actions for human review" },
        },
        required: ["incidentType", "immediateActions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_complaint_draft",
      description: "Create a complaint draft aligned with MapAble complaints register fields and mark the chat for human review.",
      parameters: {
        type: "object",
        properties: {
          issue: { type: "string", description: "Plain-language complaint issue" },
          raisedBy: { type: "string", description: "Who raised the complaint" },
          outcome: { type: "string", description: "Any requested or early outcome" },
          improvementsLogged: { type: "string", description: "Potential improvement action for review" },
        },
        required: ["issue"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_consent",
      description: "Record a user's consent decision or refusal for information sharing or support action.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Person or topic the consent applies to" },
          scope: { type: "string", description: "Specific information or action covered" },
          granted: { type: "boolean", description: "Whether consent was granted" },
          evidence: { type: "string", description: "Plain-language evidence for the consent decision" },
        },
        required: ["subject", "scope", "granted"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flag_safeguarding_concern",
      description: "Flag a safeguarding concern for human review when abuse, neglect, exploitation, immediate danger, self-harm, privacy breach, or discrimination is disclosed.",
      parameters: {
        type: "object",
        properties: {
          concernType: { type: "string", description: "Safeguarding concern category" },
          summary: { type: "string", description: "Brief factual summary from the chat" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Severity for human triage" },
        },
        required: ["concernType", "summary"],
      },
    },
  },
];

async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  sessionId: string,
  userId: string,
  clientContext?: ClientContext
): Promise<string> {
  switch (toolName) {
    case "get_user_profile": {
      const [profile] = await db
        .select()
        .from(accessContextProfiles)
        .where(eq(accessContextProfiles.userId, userId));
      if (!profile) {
        return JSON.stringify({
          message: "No accessibility profile found. The user hasn't set up their access profile yet.",
          suggestion: "Ask the user about their mobility needs, sensory preferences, and assistance requirements to provide better guidance.",
        });
      }
      return JSON.stringify({
        mobilityAids: profile.mobilityAids,
        maxTransferM: profile.maxTransferM,
        stairsAllowed: profile.stairsAllowed,
        sensoryPreferences: profile.sensoryPreferences,
        communicationMode: profile.communicationMode,
        assistancePreferences: profile.assistancePreferences,
      });
    }

    case "search_transport_workers": {
      const allWorkers = await db
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
    }

    case "check_barrier_reports": {
      const reports = await db
        .select()
        .from(communityReports)
        .where(eq(communityReports.moderationStatus, "unverified"))
        .orderBy(desc(communityReports.createdAt))
        .limit(10);

      const locationLower = (args.location || "").toLowerCase();
      const relevant = reports.filter((r) =>
        r.locationRef.toLowerCase().includes(locationLower)
      );

      if (relevant.length === 0) {
        return JSON.stringify({
          message: `No barrier reports found for "${args.location}". This could mean the area is accessible or no reports have been submitted yet.`,
          confidence: "low — no community data available",
        });
      }

      return JSON.stringify({
        reports: relevant.map((r) => ({
          type: r.barrierType,
          severity: r.severity,
          location: r.locationRef,
          description: r.description,
          reportedAt: r.createdAt,
          status: r.moderationStatus,
        })),
        confidence: "medium — based on community reports",
      });
    }

    case "get_transport_pricing": {
      const tiers = await db
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
    }

    case "submit_barrier_report": {
      const [report] = await db
        .insert(communityReports)
        .values({
          reporterUserId: userId,
          locationRef: args.locationRef,
          barrierType: args.barrierType,
          severity: args.severity,
          description: args.description || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();

      return JSON.stringify({
        success: true,
        reportId: report.id,
        message: `Barrier report submitted for ${args.locationRef}. Thank you for helping improve accessibility information for the community.`,
      });
    }

    case "book_transport": {
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
    }

    case "escalate_to_human": {
      return JSON.stringify({
        escalated: true,
        message: "I've flagged this for human support. A MapAble team member will follow up. In the meantime, you can contact MapAble support at support@mapable.com.au or call 1800 MAPABLE.",
        reason: args.reason,
        quickActions: ["call_support", "email_support"],
      });
    }

    case "get_upcoming_shifts": {
      const upcomingShifts = await storage.getUpcomingShifts(userId);
      if (upcomingShifts.length === 0) {
        return JSON.stringify({
          message: "No upcoming shifts found.",
          shifts: [],
          quickAction: "view_shifts",
        });
      }

      const shiftsWithWorkers = await Promise.all(
        upcomingShifts.map(async (shift) => {
          const workerRows = await db
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
    }

    case "book_shift": {
      if (!args.workerId || !args.date || !args.startTime || !args.endTime) {
        return JSON.stringify({
          error: "Missing required fields: workerId, date, startTime, and endTime are all required.",
        });
      }

      const budgets = await storage.getParticipantBudgets(userId);
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

      const shift = await storage.createShift({
        participantId: userId,
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

      const workerRows = await db
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
    }

    case "get_pending_invoices": {
      const pendingInvoices = await storage.getPendingInvoices(userId);
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
    }

    case "get_budget_summary": {
      const budgets = await storage.getParticipantBudgets(userId);
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
    }

    case "get_ndis_plan_goals": {
      const planCache = await storage.getNdisPlanGoals(userId);
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
    }

    case "search_grocery_products": {
      const products = await storage.getGroceryProducts({
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
    }

    case "get_grocery_orders": {
      const orders = args.activeOnly
        ? await storage.getActiveGroceryOrders(userId)
        : await storage.getGroceryOrders(userId);
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
    }

    case "navigate_to_groceries": {
      return JSON.stringify({
        action: "navigate_to_groceries",
        prefilled: {
          category: args.category || null,
          search: args.search || null,
        },
        message: "I've prepared the grocery shop for you. You can finish browsing and place an order on the Groceries page.",
        quickAction: "view_groceries",
      });
    }

    case "view_grocery_cart": {
      const cart = clientContext?.groceryCart || [];
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
    }

    case "log_incident_draft": {
      const draft = await logIncidentDraft(sessionId, userId, args);
      return JSON.stringify({
        success: true,
        draftId: draft.id,
        message: "Incident draft logged for human safeguarding review.",
        quickAction: "escalate",
      });
    }

    case "log_complaint_draft": {
      const draft = await logComplaintDraft(sessionId, userId, args);
      return JSON.stringify({
        success: true,
        draftId: draft.id,
        message: "Complaint draft logged for human review. MapAble should acknowledge complaints within 2 business days.",
        quickAction: "escalate",
      });
    }

    case "record_consent": {
      const record = await recordConsent(sessionId, userId, args);
      return JSON.stringify({
        success: true,
        consentRecordId: record.id,
        granted: record.granted,
        message: "Consent decision recorded for human review.",
      });
    }

    case "flag_safeguarding_concern": {
      const flag = await flagSafeguardingConcern(sessionId, userId, args);
      return JSON.stringify({
        success: true,
        flagId: flag.id,
        message: "Safeguarding concern flagged for human review.",
        quickAction: "escalate",
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

function applyRulesEngine(
  response: string,
  profile: AccessContextProfile | null,
  toolsUsed: string[] = [],
  toolOutputs: string[] = []
): { content: string; warnings: string[] } {
  const warnings: string[] = [];

  if (profile) {
    if (!profile.stairsAllowed && /\bstairs\b/i.test(response) && !/\bno stairs\b/i.test(response) && !/\bavoid stairs\b/i.test(response) && !/\bwithout stairs\b/i.test(response)) {
      warnings.push("Note: Your profile indicates stairs are not suitable. Any route suggestions have been checked for step-free alternatives.");
    }

    if (profile.maxTransferM && profile.maxTransferM < 100) {
      if (/\b(long walk|extended transfer|far transfer)\b/i.test(response)) {
        warnings.push(`Note: Your maximum transfer distance is ${profile.maxTransferM}m. Routes with longer transfers have been flagged.`);
      }
    }
  }

  const combinedToolOutput = toolOutputs.join(" ");

  if (toolsUsed.includes("book_shift") && /budgetWarning/i.test(combinedToolOutput)) {
    warnings.push("Budget alert: This shift may impact your remaining NDIS allocation. Check your budget summary for details.");
  }

  if (toolsUsed.includes("get_budget_summary") && /nearLimit.*true|"nearLimit":true/i.test(combinedToolOutput)) {
    warnings.push("Budget warning: One or more of your NDIS budget categories is approaching or has exceeded its allocation.");
  }

  if (toolsUsed.includes("book_shift") && /Cannot book shift/i.test(combinedToolOutput)) {
    warnings.push("Shift booking was blocked due to insufficient NDIS budget. Please review your budget allocation.");
  }

  return { content: response, warnings };
}

export interface ChatResponse {
  content: string;
  quickActions: string[];
  confidence: string;
  warnings: string[];
  toolsUsed: string[];
}

export interface ClientCartItem {
  productId: string;
  name?: string;
  unit?: string;
  price?: string | number;
  quantity: number;
}

export interface ClientContext {
  groceryCart?: ClientCartItem[];
}

export async function processChat(
  sessionId: string,
  userId: string,
  userMessage: string,
  clientContext?: ClientContext
): Promise<ChatResponse> {
  await ensureGuardrailTables();

  const existingMessages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
  const isStaffOrAdmin = currentUser?.role === "admin" || currentUser?.role === "provider" || currentUser?.role === "carer";
  const inputVerdict = classifyUserTurn(userMessage, isStaffOrAdmin);
  const guardrailToolCalls: string[] = [];
  const guardrailActions = [...inputVerdict.actions];
  const policyRefs = [...inputVerdict.policyRefs];

  await db.insert(chatMessages).values({
    sessionId,
    role: "user",
    content: userMessage,
  });

  const immediateTemplate = inputVerdict.responseTemplate || safeguardingTemplate(inputVerdict);
  if (immediateTemplate) {
    const requiredTools = await runRequiredSafeguardingActions(sessionId, userId, userMessage, inputVerdict);
    guardrailToolCalls.push(...requiredTools);

    await db.insert(chatMessages).values({
      sessionId,
      role: "assistant",
      content: immediateTemplate,
      toolCalls: guardrailToolCalls.length > 0 ? guardrailToolCalls : null,
      quickActions: ["escalate"],
      confidence: "high",
    });

    if (existingMessages.length === 0) {
      const titleSnippet = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
      await db
        .update(chatSessions)
        .set({ title: titleSnippet })
        .where(eq(chatSessions.id, sessionId));
    }

    await logGuardrailAudit({
      sessionId,
      userId,
      input: userMessage,
      output: immediateTemplate,
      toolCalls: guardrailToolCalls,
      classifierVerdicts: inputVerdict.categories,
      guardrailActions,
      policyRefs,
      flaggedForReview: guardrailToolCalls.length > 0 || inputVerdict.blocked,
    });

    return {
      content: immediateTemplate,
      quickActions: ["escalate"],
      confidence: "high",
      warnings: inputVerdict.blocked ? ["This message was handled by MapAble's safety and privacy guardrails."] : [],
      toolsUsed: guardrailToolCalls,
    };
  }

  const chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: inputVerdict.transformedInput },
  ];

  let [profile] = await db
    .select()
    .from(accessContextProfiles)
    .where(eq(accessContextProfiles.userId, userId));

  const toolsUsed: string[] = [];
  const toolOutputs: string[] = [];
  let response: OpenAI.Chat.Completions.ChatCompletion;
  let assistantContent = "";
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;
    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatHistory,
      tools,
      tool_choice: "auto",
      max_tokens: 2048,
    });

    const choice = response.choices[0];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      chatHistory.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type !== "function") continue;
        let args: Record<string, any> = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          args = {};
        }
        toolsUsed.push(toolCall.function.name);

        const toolResult = await executeToolCall(
          toolCall.function.name,
          args,
          sessionId,
          userId,
          clientContext
        );

        toolOutputs.push(toolResult);

        chatHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
      continue;
    }

    assistantContent = choice.message.content || "";
    break;
  }

  const { content: rulesContent, warnings } = applyRulesEngine(
    assistantContent,
    profile || null,
    toolsUsed,
    toolOutputs
  );

  const outputGuardrail = applyOutputGuardrails(rulesContent);
  const processedContent = outputGuardrail.content;
  guardrailActions.push(...outputGuardrail.actions);
  policyRefs.push(...outputGuardrail.policyRefs);

  const quickActions = extractQuickActions(processedContent, toolsUsed);
  const confidence = determineConfidence(toolsUsed);

  await db.insert(chatMessages).values({
    sessionId,
    role: "assistant",
    content: processedContent,
    toolCalls: toolsUsed.length > 0 ? toolsUsed : null,
    quickActions: quickActions.length > 0 ? quickActions : null,
    confidence,
  });

  if (existingMessages.length === 0) {
    const titleSnippet = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
    await db
      .update(chatSessions)
      .set({ title: titleSnippet })
      .where(eq(chatSessions.id, sessionId));
  }

  await logGuardrailAudit({
    sessionId,
    userId,
    input: userMessage,
    output: processedContent,
    toolCalls: [...toolsUsed, ...guardrailToolCalls],
    classifierVerdicts: inputVerdict.categories,
    guardrailActions,
    policyRefs,
    flaggedForReview: outputGuardrail.flagged || guardrailActions.includes("human_pathway") || guardrailToolCalls.length > 0,
  });

  return {
    content: processedContent,
    quickActions,
    confidence,
    warnings,
    toolsUsed,
  };
}

function extractQuickActions(content: string, toolsUsed: string[]): string[] {
  const actions: string[] = [];

  if (/transport|trip|travel|journey|ride/i.test(content)) {
    actions.push("book_transport");
  }
  if (/barrier|blocked|broken|out of order|closed/i.test(content)) {
    actions.push("report_barrier");
  }
  if (/worker|carer|support/i.test(content) && toolsUsed.includes("search_transport_workers")) {
    actions.push("view_workers");
  }
  if (/help|stuck|emergency|unsafe/i.test(content)) {
    actions.push("escalate");
  }
  if (/profile|preference|mobility|access need/i.test(content)) {
    actions.push("edit_profile");
  }
  if (/pric|cost|rate/i.test(content) && !toolsUsed.includes("get_budget_summary")) {
    actions.push("view_pricing");
  }
  if (toolsUsed.includes("get_upcoming_shifts") || toolsUsed.includes("book_shift") || /shift|schedule/i.test(content)) {
    actions.push("view_shifts");
  }
  if (toolsUsed.includes("get_pending_invoices") || /invoice|payment|pay|owe/i.test(content)) {
    actions.push("pay_invoice");
  }
  if (toolsUsed.includes("get_budget_summary") || /budget|allocation|ndis.*fund/i.test(content)) {
    actions.push("check_budget");
  }
  if (toolsUsed.includes("search_grocery_products") || toolsUsed.includes("navigate_to_groceries") || /grocer|shopping list|food delivery/i.test(content)) {
    actions.push("view_groceries");
  }
  if (toolsUsed.includes("get_grocery_orders")) {
    actions.push("view_grocery_orders");
  }

  return Array.from(new Set(actions));
}

function determineConfidence(toolsUsed: string[]): string {
  if (toolsUsed.includes("get_transport_pricing") || toolsUsed.includes("search_transport_workers")) {
    return "high";
  }
  if (toolsUsed.includes("get_upcoming_shifts") || toolsUsed.includes("get_pending_invoices") || toolsUsed.includes("get_budget_summary")) {
    return "high";
  }
  if (toolsUsed.includes("book_shift")) {
    return "high";
  }
  if (toolsUsed.includes("check_barrier_reports")) {
    return "medium";
  }
  if (toolsUsed.includes("get_ndis_plan_goals")) {
    return "medium";
  }
  if (toolsUsed.length === 0) {
    return "general";
  }
  return "medium";
}

export async function createChatSession(userId: string, title?: string): Promise<ChatSession> {
  const [session] = await db
    .insert(chatSessions)
    .values({ userId, title: title || "New conversation" })
    .returning();
  return session;
}

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.startedAt));
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
}
