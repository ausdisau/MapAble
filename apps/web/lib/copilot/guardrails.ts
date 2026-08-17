import type {
  CopilotAction,
  CopilotActionPlan,
  GuardrailInput,
} from "@/lib/copilot/types";

const SENSITIVE_DRAFT_TYPES = new Set([
  "SERVICE_EVENT",
  "CARE_REQUEST",
  "TRANSPORT_REQUEST",
  "PLAN_MANAGEMENT_INVOICE",
  "INCIDENT",
]);

const FINANCE_DRAFT_TYPES = new Set(["PLAN_MANAGEMENT_INVOICE"]);

export type GuardrailResult = CopilotActionPlan & {
  blockedActions: CopilotAction[];
};

export async function applyGuardrails(
  input: GuardrailInput
): Promise<GuardrailResult> {
  const { planned, context, participantId } = input;
  const warnings = [...planned.warnings];
  const requiredConfirmations = [...planned.requiredConfirmations];
  const blockedActions: CopilotAction[] = [];
  let draftRecords = [...planned.draftRecords];
  let actions = [...planned.actions];

  if (!participantId) {
    draftRecords = [];
    actions = actions.filter((a) => {
      if (
        a.type === "CREATE_DRAFT_SERVICE_EVENT" ||
        a.type === "INCIDENT_REPORT" ||
        a.type === "INVOICE_REVIEW"
      ) {
        blockedActions.push(a);
        return false;
      }
      return true;
    });
    warnings.push({
      level: "info",
      message: "Sign in to save this as a participant record.",
    });
  }

  if (context?.consentSummary.openConsentConflicts.length) {
    warnings.push({
      level: "warning",
      message:
        "Some information cannot be shared until consent settings are updated.",
    });
    requiredConfirmations.push({
      type: "CONSENT_CONFIRMATION",
      title: "Consent required before sharing",
      explanation:
        "Choose exactly which access and pickup notes can be shared with providers.",
    });
  }

  const hasServiceDraft = draftRecords.some((r) =>
    SENSITIVE_DRAFT_TYPES.has(r.type)
  );

  if (hasServiceDraft && participantId) {
    const hasTransportDraft = draftRecords.some(
      (r) => r.type === "TRANSPORT_REQUEST" || r.payload.serviceType === "transport"
    );
    if (hasTransportDraft) {
      requiredConfirmations.push({
        type: "CONSENT_CONFIRMATION",
        title: "Confirm transport access notes",
        explanation:
          "Mobility and pickup details are only shared with your explicit approval.",
      });
    }

    requiredConfirmations.push({
      type: "HUMAN_REVIEW_IF_FLAGGED",
      title: "Safety and compliance review",
      explanation:
        "A staff member may review this if it involves manual handling, medication, safeguarding, or unusual billing.",
    });
  }

  if (draftRecords.some((r) => FINANCE_DRAFT_TYPES.has(r.type))) {
    const missingEvidence = (context?.missingEvidence ?? []).length > 0;
    if (missingEvidence) {
      requiredConfirmations.push({
        type: "FINANCE_REVIEW",
        title: "Finance review required",
        explanation:
          "Evidence pack is incomplete. Export and payment require finance review or complete records.",
      });
      actions = actions.map((a) =>
        a.type === "EVIDENCE_PACK_REVIEW"
          ? { ...a, requiresConfirmation: true }
          : a
      );
    }
  }

  if (draftRecords.some((r) => r.type === "INCIDENT")) {
    requiredConfirmations.push({
      type: "SAFETY_REVIEW",
      title: "Safety review — cannot auto-close",
      explanation:
        "Incident reports are reviewed by authorised staff. Co-Pilot cannot dismiss or close incidents.",
    });
    blockedActions.push(
      ...actions.filter((a) => a.label.toLowerCase().includes("close"))
    );
    actions = actions.filter(
      (a) => !a.label.toLowerCase().includes("close incident")
    );
  }

  return {
    ...planned,
    actions,
    draftRecords,
    warnings,
    requiredConfirmations,
    blockedActions,
  };
}
