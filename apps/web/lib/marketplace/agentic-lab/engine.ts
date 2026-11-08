/**
 * MapAble+ agentic marketplace: deterministic, synthetic and network-free.
 * Original implementation drawing on the ideas (not code) of Magentic Marketplace.
 * A simulated role is never an authenticated person, verified worker or provider.
 */
export type LabScenario = "care_support" | "low_cost_at";
export type LabActor = "participant" | "participant_agent" | "provider_agent" | "worker_agent";
export type LabPhase = "draft" | "prepared" | "collecting" | "compared" | "shortlisted" | "withdrawn";
export type LabActionKind =
  | "prepare" | "approve_provider_preview" | "provider_proposal"
  | "compare_all" | "shortlist" | "approve_worker_preview"
  | "worker_acknowledge" | "withdraw";

export interface SyntheticOffer {
  readonly id: string;
  readonly scenario: LabScenario;
  readonly provider: string;
  readonly category: "support_service" | "assistive_product";
  readonly item: string;
  readonly examplePriceCents: number;
  readonly priceBasis: "hour" | "item";
  readonly accessFormat: string;
  readonly scopeNote: string;
  readonly source: "fictional_demo_only";
  readonly verifiedRegistration: false;
  readonly verifiedWorkerScreening: false;
  readonly verifiedAvailability: false;
  readonly verifiedProductSafety: false;
  readonly sponsored: false;
}

export const SAMPLE_OFFERS: readonly SyntheticOffer[] = [
  { id: "care-a", scenario: "care_support", provider: "Sample Care Co-op A (fictional)", category: "support_service",
    item: "Daily living assistance discussion", examplePriceCents: 7400, priceBasis: "hour", accessFormat: "AAC-friendly written messages",
    scopeNote: "No availability or worker credentials checked", source: "fictional_demo_only", verifiedRegistration: false,
    verifiedWorkerScreening: false, verifiedAvailability: false, verifiedProductSafety: false, sponsored: false },
  { id: "care-b", scenario: "care_support", provider: "Sample Support Group B (fictional)", category: "support_service",
    item: "Community participation support discussion", examplePriceCents: 6800, priceBasis: "hour", accessFormat: "Text and plain-language summaries",
    scopeNote: "No availability or worker credentials checked", source: "fictional_demo_only", verifiedRegistration: false,
    verifiedWorkerScreening: false, verifiedAvailability: false, verifiedProductSafety: false, sponsored: false },
  { id: "care-c", scenario: "care_support", provider: "Sample Community Service C (fictional)", category: "support_service",
    item: "Flexible support enquiry", examplePriceCents: 7900, priceBasis: "hour", accessFormat: "Longer response time and text",
    scopeNote: "No availability or worker credentials checked", source: "fictional_demo_only", verifiedRegistration: false,
    verifiedWorkerScreening: false, verifiedAvailability: false, verifiedProductSafety: false, sponsored: false },
  { id: "at-a", scenario: "low_cost_at", provider: "Sample AT Shop A (fictional)", category: "assistive_product",
    item: "Adapted jar opener example", examplePriceCents: 2600, priceBasis: "item", accessFormat: "Accessible instructions requested",
    scopeNote: "Product safety and suitability unverified", source: "fictional_demo_only", verifiedRegistration: false,
    verifiedWorkerScreening: false, verifiedAvailability: false, verifiedProductSafety: false, sponsored: false },
  { id: "at-b", scenario: "low_cost_at", provider: "Sample AT Shop B (fictional)", category: "assistive_product",
    item: "Large-key alternative keyboard example", examplePriceCents: 6100, priceBasis: "item", accessFormat: "Accessible product description requested",
    scopeNote: "Product safety and suitability unverified", source: "fictional_demo_only", verifiedRegistration: false,
    verifiedWorkerScreening: false, verifiedAvailability: false, verifiedProductSafety: false, sponsored: false },
  { id: "at-c", scenario: "low_cost_at", provider: "Sample Reuse Store C (fictional)", category: "assistive_product",
    item: "Non-powered reacher example", examplePriceCents: 3200, priceBasis: "item", accessFormat: "Text instructions requested",
    scopeNote: "Condition, ownership, recalls and hygiene unverified", source: "fictional_demo_only", verifiedRegistration: false,
    verifiedWorkerScreening: false, verifiedAvailability: false, verifiedProductSafety: false, sponsored: false },
];

export interface LabEvent {
  readonly sequence: number;
  readonly actor: LabActor;
  readonly action: LabActionKind;
  readonly detail: string;
  readonly visibility: "local_demo_only";
}
export interface LabSession {
  readonly scenario: LabScenario;
  readonly phase: LabPhase;
  readonly revision: number;
  readonly usedActionIds: readonly string[];
  readonly providerPreviewApproved: boolean;
  readonly workerPreviewApproved: boolean;
  readonly receivedOfferIds: readonly string[];
  readonly shortlistedOfferId: string | null;
  readonly events: readonly LabEvent[];
}
export interface LabAction {
  readonly id: string;
  readonly expectedRevision: number;
  readonly actor: LabActor;
  readonly kind: LabActionKind;
  readonly offerId?: string;
}
export class LabPolicyError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "LabPolicyError";
  }
}
function deny(code: string, message: string): never {
  throw new LabPolicyError(code, message);
}
function requireActor(actor: LabActor, expected: LabActor): void {
  if (actor !== expected) deny("ROLE_DENIED", "This demo action requires " + expected + ".");
}
function record(state: LabSession, action: LabAction, detail: string, updates: Partial<LabSession>): LabSession {
  const nextRevision = state.revision + 1;
  return {
    ...state,
    ...updates,
    revision: nextRevision,
    usedActionIds: [...state.usedActionIds, action.id],
    events: [...state.events, {
      sequence: nextRevision, actor: action.actor, action: action.kind,
      detail, visibility: "local_demo_only" as const,
    }],
  };
}
export function createLabSession(scenario: LabScenario = "care_support"): LabSession {
  return {
    scenario, phase: "draft", revision: 0, usedActionIds: [],
    providerPreviewApproved: false, workerPreviewApproved: false,
    receivedOfferIds: [], shortlistedOfferId: null, events: [],
  };
}
export function matchingSyntheticOffers(session: Pick<LabSession, "scenario">): readonly SyntheticOffer[] {
  return SAMPLE_OFFERS.filter((item) => item.scenario === session.scenario);
}
export function compareSyntheticOffers(session: LabSession): readonly SyntheticOffer[] {
  if (session.phase !== "compared" && session.phase !== "shortlisted") {
    deny("COMPARISON_NOT_READY", "Collect all fictional replies before comparison.");
  }
  const all = matchingSyntheticOffers(session);
  if (all.some((item) => !session.receivedOfferIds.includes(item.id))) {
    deny("INCOMPLETE_COMPARISON", "A complete neutral comparison is required.");
  }
  // Comparison order is stable, deliberately unrelated to the order/time replies arrive.
  return [...all].sort((a, b) => a.id.localeCompare(b.id));
}
export function transitionLab(state: LabSession, action: LabAction): LabSession {
  if (!action.id || action.id.length > 80 || state.usedActionIds.includes(action.id)) {
    deny("REPLAY", "A fresh action identifier is required.");
  }
  if (action.expectedRevision !== state.revision) {
    deny("STALE_REVISION", "The conversation changed; review the current state.");
  }
  if (state.phase === "withdrawn") {
    deny("WITHDRAWN", "Consent was withdrawn. Start a new fictional session.");
  }
  switch (action.kind) {
    case "prepare": {
      requireActor(action.actor, "participant");
      if (state.phase !== "draft") deny("INVALID_PHASE", "Already prepared.");
      return record(state, action, "Participant prepared a fixed fictional support scenario.", { phase: "prepared" });
    }
    case "approve_provider_preview": {
      requireActor(action.actor, "participant");
      if (state.phase !== "prepared") deny("INVALID_PHASE", "Prepare the scenario first.");
      return record(state, action, "Participant explicitly allowed LOCAL synthetic provider previews only.", {
        phase: "collecting", providerPreviewApproved: true,
      });
    }
    case "provider_proposal": {
      requireActor(action.actor, "provider_agent");
      if (state.phase !== "collecting" || !state.providerPreviewApproved) {
        deny("CONSENT_REQUIRED", "Participant must approve the local provider preview.");
      }
      const item = matchingSyntheticOffers(state).find((offer) => offer.id === action.offerId);
      if (!item) deny("INVALID_OFFER", "Unknown or unrelated fictional offer.");
      if (state.receivedOfferIds.includes(item.id)) deny("DUPLICATE_PROPOSAL", "Offer already received.");
      return record(state, action, "Fictional provider agent supplied a nonbinding example offer: " + item.id, {
        receivedOfferIds: [...state.receivedOfferIds, item.id],
      });
    }
    case "compare_all": {
      requireActor(action.actor, "participant_agent");
      if (state.phase !== "collecting" || !state.providerPreviewApproved) {
        deny("INVALID_PHASE", "Fictional proposals are not being collected.");
      }
      if (matchingSyntheticOffers(state).some((offer) => !state.receivedOfferIds.includes(offer.id))) {
        deny("INCOMPLETE_COMPARISON", "Wait for all sample offers. Response speed cannot determine selection.");
      }
      return record(state, action, "Participant agent prepared an unranked full comparison; human choice required.", {
        phase: "compared",
      });
    }
    case "shortlist": {
      requireActor(action.actor, "participant");
      if (state.phase !== "compared") deny("INVALID_PHASE", "Compare all proposals before shortlisting.");
      const item = matchingSyntheticOffers(state).find((offer) => offer.id === action.offerId);
      if (!item || !state.receivedOfferIds.includes(item.id)) {
        deny("INVALID_OFFER", "Choose an offer from the complete synthetic comparison.");
      }
      return record(state, action, "Participant shortlisted a fictional offer for further human review, NOT a booking.", {
        phase: "shortlisted", shortlistedOfferId: item.id,
      });
    }
    case "approve_worker_preview": {
      requireActor(action.actor, "participant");
      if (state.phase !== "shortlisted" || state.scenario !== "care_support") {
        deny("WORKER_SCOPE", "Worker preview is available only for a shortlisted care example.");
      }
      if (state.workerPreviewApproved) deny("INVALID_PHASE", "Already approved.");
      return record(state, action, "Participant separately approved LOCAL fictional worker briefing.", {
        workerPreviewApproved: true,
      });
    }
    case "worker_acknowledge": {
      requireActor(action.actor, "worker_agent");
      if (state.phase !== "shortlisted" || !state.workerPreviewApproved) {
        deny("CONSENT_REQUIRED", "Participant must separately approve the local worker preview.");
      }
      if (state.events.some((event) => event.action === "worker_acknowledge")) {
        deny("DUPLICATE_ACKNOWLEDGEMENT", "Worker demo acknowledgement already recorded.");
      }
      return record(state, action, "Fictional worker agent acknowledged a limited task brief; clearance NOT verified.", {});
    }
    case "withdraw": {
      requireActor(action.actor, "participant");
      return record(state, action, "Participant withdrew all fictional sharing permissions. No contact occurred.", {
        phase: "withdrawn", providerPreviewApproved: false, workerPreviewApproved: false,
        shortlistedOfferId: null,
      });
    }
    default: {
      const impossible: never = action.kind;
      return deny("UNKNOWN_ACTION", "Unknown action " + impossible);
    }
  }
}
export function runLocalSequence(
  state: LabSession,
  steps: readonly Omit<LabAction, "id" | "expectedRevision">[],
): LabSession {
  return steps.reduce((current, step) => transitionLab(current, {
    ...step, id: "demo-step-" + (current.revision + 1), expectedRevision: current.revision,
  }), state);
}
