import {
  flagSafeguardingConcern,
  logComplaintDraft,
  logIncidentDraft,
  recordConsent,
} from "../../chat-guardrails";
import type { ChatModule } from "../types";

/**
 * Safeguarding tools write review records via the existing guardrails layer.
 * Always-on so the model can record an incident/complaint/consent/concern on any
 * turn where a disclosure surfaces.
 */
export const safeguardingModule: ChatModule = {
  name: "safeguarding",
  description: "Logs incident/complaint drafts, records consent decisions, and flags safeguarding concerns for human review.",
  alwaysOn: true,
  intents: ["incident", "complaint", "consent", "safeguard", "abuse", "neglect", "harm", "danger", "unsafe", "privacy"],
  quickActions: ["escalate"],
  tools: [
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
  ],
  handlers: {
    log_incident_draft: async (args, ctx) => {
      const draft = await logIncidentDraft(ctx.sessionId, ctx.userId, args);
      return JSON.stringify({
        success: true,
        draftId: draft.id,
        message: "Incident draft logged for human safeguarding review.",
        quickAction: "escalate",
      });
    },

    log_complaint_draft: async (args, ctx) => {
      const draft = await logComplaintDraft(ctx.sessionId, ctx.userId, args);
      return JSON.stringify({
        success: true,
        draftId: draft.id,
        message: "Complaint draft logged for human review. MapAble should acknowledge complaints within 2 business days.",
        quickAction: "escalate",
      });
    },

    record_consent: async (args, ctx) => {
      const record = await recordConsent(ctx.sessionId, ctx.userId, args);
      return JSON.stringify({
        success: true,
        consentRecordId: record.id,
        granted: record.granted,
        message: "Consent decision recorded for human review.",
      });
    },

    flag_safeguarding_concern: async (args, ctx) => {
      const flag = await flagSafeguardingConcern(ctx.sessionId, ctx.userId, args);
      return JSON.stringify({
        success: true,
        flagId: flag.id,
        message: "Safeguarding concern flagged for human review.",
        quickAction: "escalate",
      });
    },
  },
};
