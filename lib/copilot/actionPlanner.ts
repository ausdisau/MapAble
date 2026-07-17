import { planProviderFinderCopilotActions } from "@/lib/copilot/plan-provider-finder";
import type { CopilotActionPlan, CopilotPlanningInput } from "@/lib/copilot/types";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";
import type { DraftPrmsRecord } from "@/lib/prms/types";
import type { ProviderFinderSessionFields } from "@/lib/provider-finder/ask-bridge";

function draft(
  type: DraftPrmsRecord["type"],
  participantId: string,
  payload: Record<string, unknown>,
  status: DraftPrmsRecord["status"] = "needs_confirmation"
): DraftPrmsRecord {
  return {
    type,
    status,
    participantId,
    payload,
  };
}

export type CopilotPlanningExtras = {
  session?: Partial<ProviderFinderSessionFields>;
  providerSlug?: string;
  providerName?: string;
  agentSessionId?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
};

export async function planCopilotActions(
  input: CopilotPlanningInput,
  extras?: CopilotPlanningExtras,
): Promise<CopilotActionPlan> {
  const { intent, query, context, participantId } = input;
  const pid = participantId ?? context?.participantId ?? MOCK_PARTICIPANT_ID;
  const filters = { ...intent.filters };

  switch (intent.type) {
    case "provider_finder":
      return planProviderFinderCopilotActions(query, extras?.session, {
        providerSlug: extras?.providerSlug,
        providerName: extras?.providerName,
        agentSessionId: extras?.agentSessionId,
        messages: extras?.messages,
      });

    case "combined":
      return {
        summary: "Combined care and accessible transport request",
        plainLanguageAnswer:
          "I can help draft a care and transport plan using your access needs. Nothing is booked until you review and confirm.",
        filters,
        actions: [
          {
            type: "CREATE_DRAFT_SERVICE_EVENT",
            label: "Draft care + transport plan",
            requiresConfirmation: true,
          },
          {
            type: "CHECK_CONSENT",
            label: "Check what notes can be shared with providers",
            requiresConfirmation: false,
          },
          {
            type: "CHECK_NDIS_PLAN",
            label: "Check NDIS plan category fit",
            requiresConfirmation: false,
          },
        ],
        draftRecords: [
          draft("SERVICE_EVENT", pid, {
            serviceType: "care_transport_bundle",
            sourceQuery: query,
            goalLinked: true,
          }),
          draft("CARE_REQUEST", pid, {
            supportType: "community_access",
            sourceQuery: query,
          }),
          draft("TRANSPORT_REQUEST", pid, {
            accessibilityRequired: true,
            wheelchairTransport: true,
            sourceQuery: query,
          }),
        ],
        requiredConfirmations: [
          {
            type: "PARTICIPANT_CONFIRMATION",
            title: "Confirm draft care + transport plan",
            explanation:
              "Nothing will be sent to providers until you review and confirm the details.",
          },
        ],
        warnings: context?.missingEvidence.length
          ? [
              {
                level: "info",
                message:
                  "Some past services are missing signed support logs. New bookings can still be drafted.",
              },
            ]
          : [],
      };

    case "billing":
      return {
        summary: "Invoice and evidence review",
        plainLanguageAnswer:
          "I can help explain an invoice and prepare an evidence checklist. Payments are not released without your approval and complete records.",
        filters,
        actions: [
          {
            type: "INVOICE_REVIEW",
            label: "Review invoice against service records",
            requiresConfirmation: true,
          },
          {
            type: "EVIDENCE_PACK_REVIEW",
            label: "Open evidence pack checklist",
            requiresConfirmation: true,
          },
        ],
        draftRecords: [
          draft("PLAN_MANAGEMENT_INVOICE", pid, {
            sourceQuery: query,
            status: "pending_review",
          }),
        ],
        requiredConfirmations: [
          {
            type: "PARTICIPANT_CONFIRMATION",
            title: "Approve or dispute invoice",
            explanation:
              "You can approve, dispute, or ask for clarification before any claim is finalised.",
          },
        ],
        warnings: (context?.missingEvidence ?? []).map((m) => ({
          level: "warning" as const,
          message: m,
        })),
      };

    case "incident":
      return {
        summary: "Safety and incident support",
        plainLanguageAnswer:
          "Your safety comes first. I can help you start an incident record. A trained person will review this — incidents are never closed automatically.",
        filters: { ...filters, safety: true },
        actions: [
          {
            type: "INCIDENT_REPORT",
            label: "Start incident report (draft)",
            requiresConfirmation: true,
          },
          {
            type: "SAFETY_ESCALATION",
            label: "See urgent contacts",
            requiresConfirmation: false,
          },
        ],
        draftRecords: [
          draft("INCIDENT", pid, {
            sourceQuery: query,
            severity: "unknown",
            reportableScreening: "pending",
          }),
        ],
        requiredConfirmations: [
          {
            type: "SAFETY_REVIEW",
            title: "Safety review required",
            explanation:
              "A MapAble staff member will review this report. You will be kept informed.",
          },
        ],
        warnings: [
          {
            level: "urgent",
            message:
              "If anyone is in immediate danger, call 000 (Australia) or your emergency contact now.",
          },
        ],
      };

    case "ndis": {
      const { formatBudgetCopilotAnswer, isBudgetGuidanceEnabled, NON_ADVISORY_DISCLAIMER } =
        await import("@/lib/budget/budget-guidance-service");
      const budgetAnswer =
        pid && isBudgetGuidanceEnabled()
          ? formatBudgetCopilotAnswer(pid)
          : "I can summarise your plan status and budget bands in plain language. Exact amounts are shown only when you are signed in.";
      return {
        summary: "NDIS plan and budget guidance",
        plainLanguageAnswer: budgetAnswer,
        filters,
        actions: [
          {
            type: "PLAN_SUMMARY",
            label: "View plan summary",
            requiresConfirmation: false,
          },
          {
            type: "BUDGET_EXPLANATION",
            label: "Explain budget categories",
            requiresConfirmation: false,
          },
        ],
        draftRecords: context
          ? [
              draft("PROGRESS_NOTE", pid, {
                noteType: "plan_review_prep",
                sourceQuery: query,
              }),
            ]
          : [],
        requiredConfirmations: [],
        warnings: isBudgetGuidanceEnabled()
          ? [
              {
                level: "info" as const,
                message: NON_ADVISORY_DISCLAIMER,
              },
            ]
          : [],
      };
    }

    case "jobs":
      return {
        summary: "Employment support",
        plainLanguageAnswer:
          "I can draft employment support records and suggest transport for interviews if needed.",
        filters,
        actions: [
          {
            type: "EMPLOYMENT_SUPPORT",
            label: "Draft employment support record",
            requiresConfirmation: true,
          },
        ],
        draftRecords: [
          draft("EMPLOYMENT_SUPPORT_RECORD", pid, {
            sourceQuery: query,
          }),
        ],
        requiredConfirmations: [
          {
            type: "PARTICIPANT_CONFIRMATION",
            title: "Confirm employment support draft",
            explanation:
              "Workplace adjustment details are only shared with consent.",
          },
        ],
        warnings: [],
      };

    case "transport":
    case "support":
      return {
        summary:
          intent.type === "transport"
            ? "Accessible transport request"
            : "Support worker request",
        plainLanguageAnswer:
          "I can draft a service request for your review. Tell me the date and time if you have not already.",
        filters,
        actions: [
          {
            type: "CREATE_DRAFT_SERVICE_EVENT",
            label: `Draft ${intent.type} service event`,
            requiresConfirmation: true,
          },
        ],
        draftRecords: [
          draft("SERVICE_EVENT", pid, {
            serviceType: intent.type,
            sourceQuery: query,
          }),
        ],
        requiredConfirmations: [
          {
            type: "PARTICIPANT_CONFIRMATION",
            title: "Confirm service draft",
            explanation: "Nothing is booked until you confirm.",
          },
        ],
        warnings: [],
      };

    default:
      return {
        summary: "Guidance request",
        plainLanguageAnswer:
          "I can explain options and suggest next steps. Sign in to save drafts to your participant record.",
        filters,
        actions: [
          {
            type: "GUIDANCE_ONLY",
            label: "Browse help topics",
            requiresConfirmation: false,
          },
        ],
        draftRecords: [],
        requiredConfirmations: [],
        warnings: [],
      };
  }
}
