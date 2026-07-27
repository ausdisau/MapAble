import type { ConsentScope } from "@/types/mapable";

export const CAREOS_CONSENT_SCOPES = [
  "profile.basic",
  "profile.accessibility",
  "profile.communication",
  "care.preferences",
  "care.requests",
  "care.schedule",
  "care.notes",
  "transport.location",
  "transport.accessibility",
  "transport.bookings",
  "access.place_evidence",
  "payments.budget",
  "payments.invoices",
  "jobs.preferences",
  "jobs.adjustments",
  "jobs.disclosure",
] as const;

export type CareOSConsentScope = (typeof CAREOS_CONSENT_SCOPES)[number];

/**
 * Existing consent records remain authoritative. Scopes without a mapped
 * record deliberately fail closed until their dedicated consent record exists.
 */
export const CAREOS_SCOPE_TO_MAPABLE_SCOPE: Partial<
  Record<CareOSConsentScope, ConsentScope>
> = {
  "profile.basic": "profile.read",
  "profile.accessibility": "accessibility.read",
  "care.requests": "booking.read",
  "transport.accessibility": "transport.accessibility_share",
  "transport.bookings": "transport.trip_access",
};

export const CAREOS_CONSENT_EXPLANATIONS: Record<
  CareOSConsentScope,
  { information: string; reason: string; function: string; stored: boolean }
> = {
  "profile.basic": { information: "your basic profile", reason: "identify your request", function: "CareOS Context", stored: false },
  "profile.accessibility": { information: "your accessibility profile", reason: "check accessibility fit", function: "Mission Composer", stored: false },
  "profile.communication": { information: "communication preferences", reason: "present information accessibly", function: "CareOS Context", stored: false },
  "care.preferences": { information: "care preferences", reason: "find suitable care options", function: "Care Agent", stored: false },
  "care.requests": { information: "care requests", reason: "avoid duplicating existing arrangements", function: "Care Agent", stored: false },
  "care.schedule": { information: "appointment timing", reason: "coordinate a plan", function: "Mission Composer", stored: false },
  "care.notes": { information: "care notes", reason: "understand support context", function: "Care Agent", stored: false },
  "transport.location": { information: "pickup and destination locations", reason: "find compatible transport", function: "Transport Agent", stored: false },
  "transport.accessibility": { information: "transport accessibility needs", reason: "exclude unsuitable vehicles", function: "Transport Agent", stored: false },
  "transport.bookings": { information: "existing transport bookings", reason: "avoid conflicts", function: "Transport Agent", stored: false },
  "access.place_evidence": { information: "destination accessibility evidence", reason: "explain destination access", function: "Access Evidence Agent", stored: false },
  "payments.budget": { information: "budget information", reason: "not used in this release", function: "None", stored: false },
  "payments.invoices": { information: "invoice information", reason: "not used in this release", function: "None", stored: false },
  "jobs.preferences": { information: "job preferences", reason: "not used in this release", function: "None", stored: false },
  "jobs.adjustments": { information: "workplace adjustments", reason: "not used in this release", function: "None", stored: false },
  "jobs.disclosure": { information: "disclosure choices", reason: "not used in this release", function: "None", stored: false },
};
