import type {
  CareIntakeResult,
  CarePlanDraft,
  WorkerCapabilityRequirement,
} from "@/server/agents/care/types";

function cap(
  id: string,
  label: string,
  reason: string,
  required = true
): WorkerCapabilityRequirement {
  return { id, label, reason, required };
}

export function runWorkerCapabilityAgent(
  intake: CareIntakeResult,
  carePlanDraft: CarePlanDraft
): WorkerCapabilityRequirement[] {
  const capabilities: WorkerCapabilityRequirement[] = [
    cap(
      "verified_worker_screening",
      "Verified worker screening",
      "All care workers must have verified screening before assignment.",
      true
    ),
    cap(
      "organisation_match",
      "Provider organisation match",
      "Worker must belong to the assigned provider organisation.",
      true
    ),
  ];

  const hasHighIntensity = carePlanDraft.tasks.some((t) => t.intensity === "high");
  if (hasHighIntensity) {
    capabilities.push(
      cap(
        "high_intensity_competency",
        "High-intensity competency",
        "One or more tasks are marked high intensity and need a verified competent worker.",
        true
      )
    );
  }

  if (intake.riskSignals.includes("manual_handling")) {
    capabilities.push(
      cap(
        "manual_handling_awareness",
        "Manual handling awareness",
        "Support may involve transfers or manual handling — staff review required.",
        true
      )
    );
  }

  if (intake.riskSignals.includes("medication_prompting")) {
    capabilities.push(
      cap(
        "medication_prompting_supervision",
        "Medication prompting supervision",
        "Medication prompting must follow policy and human review; workers do not diagnose or prescribe.",
        true
      )
    );
  }

  if (intake.riskSignals.includes("behaviour_support")) {
    capabilities.push(
      cap(
        "behaviour_support",
        "Behaviour support capability",
        "Behaviour-related support needs qualified review before matching.",
        true
      )
    );
  }

  if (intake.riskSignals.includes("safeguarding")) {
    capabilities.push(
      cap(
        "safeguarding_review",
        "Safeguarding review",
        "Safeguarding-related signals require authorised human review.",
        true
      )
    );
  }

  if (carePlanDraft.requestType === "personal_care") {
    capabilities.push(
      cap(
        "personal_care_scope",
        "Personal care scope",
        "Personal care tasks require explicit participant confirmation before provider sharing.",
        true
      )
    );
  }

  if (carePlanDraft.linkedTransportRequired) {
    capabilities.push(
      cap(
        "care_transport_coordination",
        "Care and transport coordination",
        "Linked transport may need a separate transport booking after care is confirmed.",
        false
      )
    );
  }

  return capabilities;
}
