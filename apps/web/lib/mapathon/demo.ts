// Fictional MapAble Signal mapathon fixtures; no live observations or events.
export type MapathonFocus =
  | "journeys"
  | "entrances"
  | "facilities"
  | "sensory"
  | "changes";

export type ParticipationMode = "remote" | "field" | "supported";
export type ContributorRole = "mapper" | "researcher" | "reviewer";
export type EvidenceSource = "direct" | "venue" | "online" | "unknown";
export type MapathonView = "list" | "map";

export type FeatureId =
  | "path"
  | "crossing"
  | "entrance"
  | "doorway"
  | "toilet"
  | "lift"
  | "signage"
  | "sensory"
  | "communication"
  | "change";

export type MapathonChallenge = {
  id: MapathonFocus;
  title: string;
  shortTitle: string;
  description: string;
  prompt: string;
  featureIds: readonly FeatureId[];
  accent: "blue" | "green" | "orange";
  synthetic: true;
  published: false;
};

export type DemoMapPlace = {
  id: string;
  name: string;
  category: string;
  description: string;
  x: number;
  y: number;
  focus: readonly MapathonFocus[];
  synthetic: true;
  published: false;
};

export type EvidenceFeature = {
  id: FeatureId;
  label: string;
  hint: string;
  measurement?: "mm";
};

export type PracticeDraft = {
  id: string;
  placeId: string;
  challengeId: MapathonFocus;
  featureId: FeatureId;
  role: ContributorRole;
  mode: ParticipationMode;
  source: EvidenceSource;
  detail: string;
  measurementMm: number | null;
  state: "local_practice_draft";
  synthetic: true;
  published: false;
};

export const MAPATHON_CHALLENGES: readonly MapathonChallenge[] = [
  {
    id: "journeys",
    title: "Connect the Journey",
    shortTitle: "Routes & crossings",
    description: "Look at the connections between transport, paths, crossings and destinations.",
    prompt: "What information is missing from a complete journey?",
    featureIds: ["path", "crossing"],
    accent: "blue",
    synthetic: true,
    published: false,
  },
  {
    id: "entrances",
    title: "Every Entrance Counts",
    shortTitle: "Entrances",
    description: "Describe thresholds, step-free entry and doorway measurements without blanket labels.",
    prompt: "Which entrance details would help a visitor plan ahead?",
    featureIds: ["entrance", "doorway"],
    accent: "green",
    synthetic: true,
    published: false,
  },
  {
    id: "facilities",
    title: "Essential Access",
    shortTitle: "Facilities",
    description: "Identify what people need to know about accessible toilets, lifts and facilities.",
    prompt: "Which practical facilities need clear, up-to-date details?",
    featureIds: ["toilet", "lift"],
    accent: "orange",
    synthetic: true,
    published: false,
  },
  {
    id: "sensory",
    title: "Quiet, Clear and Welcoming",
    shortTitle: "Sensory & communication",
    description: "Explore signage, sensory load, quiet spaces and accessible information.",
    prompt: "What information would support different communication and sensory needs?",
    featureIds: ["signage", "sensory", "communication"],
    accent: "blue",
    synthetic: true,
    published: false,
  },
  {
    id: "changes",
    title: "Is It Still Accessible?",
    shortTitle: "Check changes",
    description: "Compare dated reports and record what needs re-verification.",
    prompt: "What changed, when, and what still needs checking?",
    featureIds: ["change"],
    accent: "green",
    synthetic: true,
    published: false,
  },
] as const;

export const DEMO_MAP_PLACES: readonly DemoMapPlace[] = [
  {
    id: "demo-crossing",
    name: "Fictional civic crossing",
    category: "Street connection",
    description: "A pretend crossing and approach for practising route observations.",
    x: 25,
    y: 72,
    focus: ["journeys", "changes"],
    synthetic: true,
    published: false,
  },
  {
    id: "demo-library",
    name: "Fictional library",
    category: "Public building",
    description: "A pretend library with an entrance and wayfinding questions.",
    x: 54,
    y: 32,
    focus: ["entrances", "sensory", "changes"],
    synthetic: true,
    published: false,
  },
  {
    id: "demo-community-hub",
    name: "Fictional community hub",
    category: "Community venue",
    description: "A pretend community venue for facility and communication examples.",
    x: 77,
    y: 59,
    focus: ["facilities", "sensory", "entrances"],
    synthetic: true,
    published: false,
  },
  {
    id: "demo-station",
    name: "Fictional transit stop",
    category: "Transport",
    description: "A pretend transport stop for path and change-checking exercises.",
    x: 24,
    y: 29,
    focus: ["journeys", "changes"],
    synthetic: true,
    published: false,
  },
] as const;

export const EVIDENCE_FEATURES: readonly EvidenceFeature[] = [
  { id: "path", label: "Path and surface", hint: "Surface, clear width, slope and obstructions." },
  { id: "crossing", label: "Crossing and kerb ramp", hint: "Crossing controls, kerb transitions and evidence gaps." },
  { id: "entrance", label: "Entrance and threshold", hint: "Exact entrance, steps, threshold and alternative routes." },
  { id: "doorway", label: "Doorway clear opening", hint: "Measured clear opening in millimetres, if known.", measurement: "mm" },
  { id: "toilet", label: "Toilet and change facility", hint: "Facility type, equipment, restrictions and availability." },
  { id: "lift", label: "Lift and circulation", hint: "Lift location, availability and connection to public spaces." },
  { id: "signage", label: "Signs and wayfinding", hint: "Plain language, tactile information, contrast and navigation." },
  { id: "sensory", label: "Sensory environment", hint: "Noise, lighting, quiet space and variation by time." },
  { id: "communication", label: "Communication access", hint: "Accessible formats, text, AAC, hearing support and staff information." },
  { id: "change", label: "Change since last report", hint: "What changed, source, date and what needs rechecking." },
] as const;

export const MODE_OPTIONS: readonly { id: ParticipationMode; label: string; help: string }[] = [
  { id: "remote", label: "From home", help: "Review published information without visiting a place." },
  { id: "field", label: "On location", help: "Observe only from safe, permitted public areas." },
  { id: "supported", label: "With support", help: "Contribute with a person or communication method you choose." },
] as const;

export const ROLE_OPTIONS: readonly { id: ContributorRole; label: string; help: string }[] = [
  { id: "mapper", label: "Observe", help: "Record one feature and its limitations." },
  { id: "researcher", label: "Research", help: "Identify details and their sources remotely." },
  { id: "reviewer", label: "Check", help: "Spot missing details and questions for verification." },
] as const;

export const SOURCE_OPTIONS: readonly { id: EvidenceSource; label: string; help: string }[] = [
  { id: "direct", label: "Direct observation", help: "Observed or measured personally, not independently verified." },
  { id: "venue", label: "Venue information", help: "Reported by staff or operator." },
  { id: "online", label: "Public web source", help: "Information from a dated online source." },
  { id: "unknown", label: "Unknown / not assessed", help: "Not enough information; a valid finding." },
] as const;

export const PRACTICE_TARGET = 3;

export function getChallenge(id: MapathonFocus): MapathonChallenge {
  return MAPATHON_CHALLENGES.find((challenge) => challenge.id === id) ?? MAPATHON_CHALLENGES[0];
}

export function getEligiblePlaces(focus: MapathonFocus): readonly DemoMapPlace[] {
  return DEMO_MAP_PLACES.filter((place) => place.focus.includes(focus));
}

export function getFeature(id: FeatureId): EvidenceFeature {
  return EVIDENCE_FEATURES.find((feature) => feature.id === id) ?? EVIDENCE_FEATURES[0];
}

export function validatePracticeDraft(
  input: Omit<PracticeDraft, "id" | "state" | "synthetic" | "published">,
): string | null {
  const challenge = MAPATHON_CHALLENGES.find((item) => item.id === input.challengeId);
  const place = DEMO_MAP_PLACES.find((item) => item.id === input.placeId);
  if (!challenge || !place || !place.focus.includes(challenge.id)) {
    return "Choose a demonstration place matching this challenge.";
  }
  if (!challenge.featureIds.includes(input.featureId)) {
    return "Choose a feature from this challenge.";
  }
  if (!MODE_OPTIONS.some((mode) => mode.id === input.mode) || !ROLE_OPTIONS.some((role) => role.id === input.role)) {
    return "Choose a participation mode and role.";
  }
  if (!SOURCE_OPTIONS.some((source) => source.id === input.source)) {
    return "Choose how the information was obtained.";
  }
  if (input.mode === "remote" && input.source === "direct") {
    return "For this remote exercise, choose a web, venue or unknown source.";
  }
  if (input.detail.trim().length < 8 || input.detail.length > 400) {
    return "Describe the feature or information gap in 8 to 400 characters.";
  }
  const feature = getFeature(input.featureId);
  if (input.measurementMm !== null) {
    if (feature.measurement !== "mm" || !Number.isFinite(input.measurementMm) || input.measurementMm <= 0 || input.measurementMm > 5000) {
      return "Enter a plausible positive doorway measurement in millimetres, or leave it blank.";
    }
    if (input.source !== "direct") {
      return "Enter a measured width only with a direct-observation source; otherwise describe the reported value in the notes.";
    }
  }
  return null;
}

export function assertDemoMapathonIsUnpublished(): boolean {
  const challengeIds = new Set(MAPATHON_CHALLENGES.map((item) => item.id));
  const placeIds = new Set(DEMO_MAP_PLACES.map((item) => item.id));
  return (
    challengeIds.size === MAPATHON_CHALLENGES.length &&
    placeIds.size === DEMO_MAP_PLACES.length &&
    MAPATHON_CHALLENGES.every((challenge) =>
      challenge.synthetic &&
      !challenge.published &&
      challenge.featureIds.length > 0 &&
      getEligiblePlaces(challenge.id).length > 0,
    ) &&
    DEMO_MAP_PLACES.every((place) => place.synthetic && !place.published && place.focus.length > 0)
  );
}
