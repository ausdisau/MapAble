import type {
  CareGuardrailInput,
  CareGuardrailResult,
  TransformCheckpoint,
} from "@/server/agents/care/types";

const HIGH_RISK_SIGNALS = new Set([
  "manual_handling",
  "medication_prompting",
  "behaviour_support",
  "safeguarding",
]);

function checkpoint(
  id: string,
  type: TransformCheckpoint["type"],
  title: string,
  explanation: string,
  requiredBeforeBooking: boolean
): TransformCheckpoint {
  return { id, type, title, explanation, requiredBeforeBooking };
}

export function runCareGuardrailAgent(
  input: CareGuardrailInput
): CareGuardrailResult {
  const { intake, carePlanDraft, participantId, preferences, sessionOnly } =
    input;
  const missingInformation: string[] = [];
  const auditTriggers: string[] = [];
  const redactedFields: string[] = [];
  const appliedRules: string[] = [];
  const blockedReasons: string[] = [];
  const checkpoints: TransformCheckpoint[] = [];

  const humanReviewRequired = intake.riskSignals.some((s) =>
    HIGH_RISK_SIGNALS.has(s)
  );

  appliedRules.push("no_diagnose");
  appliedRules.push("no_ndis_eligibility_determination");
  appliedRules.push("no_auto_finalize_booking");
  appliedRules.push("no_auto_assign_workers");

  if (intake.riskSignals.includes("clinical_diagnosis_language")) {
    auditTriggers.push("clinical_language_ignored");
  }
  if (intake.riskSignals.includes("ndis_eligibility_language")) {
    auditTriggers.push("ndis_eligibility_not_determined");
    missingInformation.push(
      "Funding source is not confirmed here — speak with your plan manager or support coordinator if you need funding guidance."
    );
  }

  const draft = { ...carePlanDraft };
  draft.status = "needs_confirmation";
  draft.bookingStatus = "blocked_until_participant_confirmation";
  draft.autoAssignWorkers = false;
  draft.autoFinalizeBooking = false;

  const personalCareConfirmationRequired =
    draft.requestType === "personal_care";

  if (personalCareConfirmationRequired) {
    appliedRules.push("personal_care_participant_confirmation");
    checkpoints.push(
      checkpoint(
        "participant_confirm_personal_care",
        "PARTICIPANT_CONFIRMATION",
        "Confirm personal care details",
        "Personal care will not be shared with providers until you review and confirm what support you want.",
        true
      )
    );
  }

  checkpoints.push(
    checkpoint(
      "participant_confirm_plan_draft",
      "PARTICIPANT_CONFIRMATION",
      "Confirm care plan draft",
      "Nothing is booked and no worker is assigned until you confirm this draft.",
      true
    )
  );

  if (
    draft.shareAccessibility &&
    !draft.shareAccessibilityConfirmed
  ) {
    appliedRules.push("accessibility_consent_required");
    missingInformation.push(
      "Confirm whether accessibility or access notes can be shared with providers (minimum necessary sharing)."
    );
    checkpoints.push(
      checkpoint(
        "consent_access_notes",
        "CONSENT_CONFIRMATION",
        "Confirm access note sharing",
        "Access and pickup details are only shared when you explicitly confirm.",
        true
      )
    );
    draft.accessRequirementsSummary = undefined;
    redactedFields.push("accessRequirementsSummary");
  }

  if (humanReviewRequired) {
    appliedRules.push("human_review_high_risk_signals");
    auditTriggers.push("human_review_required");
    checkpoints.push(
      checkpoint(
        "human_review_safety",
        "HUMAN_REVIEW_IF_FLAGGED",
        "Safety and compliance review",
        "This request may involve manual handling, medication prompting, behaviour support, or safeguarding — a staff member will review before proceeding.",
        true
      )
    );
    if (intake.riskSignals.includes("safeguarding")) {
      checkpoints.push(
        checkpoint(
          "safety_review_safeguarding",
          "SAFETY_REVIEW",
          "Safeguarding review",
          "Safeguarding-related concerns are reviewed by authorised staff. This tool cannot close or dismiss safety matters.",
          true
        )
      );
    }
  }

  if (!draft.preferredDate && !draft.startTime) {
    missingInformation.push("Preferred date or time for support (if known).");
  }
  if (!draft.suburb && !draft.address) {
    missingInformation.push("Location or suburb where support is needed.");
  }
  if (sessionOnly || !participantId) {
    appliedRules.push("session_only_stricter_sharing");
    draft.accessRequirementsSummary = undefined;
    redactedFields.push("accessRequirementsSummary");
    missingInformation.push(
      "Sign in and link your participant profile to save and share this plan with providers."
    );
  }

  if (!preferences.fundingSourceId && !intake.riskSignals.includes("ndis_eligibility_language")) {
    missingInformation.push(
      "Funding source (optional) — confirm with your plan manager if unsure."
    );
  }

  const guardrailDecision = {
    allowed: true,
    autoAssignWorkers: false as const,
    autoFinalizeBooking: false as const,
    humanReviewRequired,
    personalCareConfirmationRequired,
    blockedReasons,
    appliedRules,
  };

  return {
    guardrailDecision,
    checkpoints,
    missingInformation: [...new Set(missingInformation)],
    carePlanDraft: draft,
    auditTriggers,
    redactedFields: [...new Set(redactedFields)],
  };
}
