/**
 * Staged location disclosure for transport.
 * Exact addresses must not be returned before quote acceptance + assignment window.
 */

export type LocationDisclosureStage =
  | "request"
  | "quote"
  | "accepted"
  | "assigned"
  | "in_service"
  | "completed";

export type LocationView = {
  stage: LocationDisclosureStage;
  label: string;
  suburb?: string;
  exactAddress?: string;
  coordinates?: { lat: number; lng: number };
  redacted: boolean;
  reason: string;
};

export function projectLocationForStage(input: {
  stage: LocationDisclosureStage;
  suburb?: string;
  exactAddress?: string;
  coordinates?: { lat: number; lng: number };
  role: "participant" | "provider" | "driver" | "delegate" | "admin";
}): LocationView {
  const suburb = input.suburb?.trim() || "Suburb withheld";

  if (input.role === "participant" || input.role === "admin") {
    return {
      stage: input.stage,
      label: input.exactAddress ?? suburb,
      suburb,
      exactAddress: input.exactAddress,
      coordinates: input.coordinates,
      redacted: false,
      reason: "Participant or audited admin may view full location.",
    };
  }

  if (input.stage === "request" || input.stage === "quote") {
    return {
      stage: input.stage,
      label: suburb,
      suburb,
      redacted: true,
      reason: "Exact address withheld until quote acceptance and assignment.",
    };
  }

  if (input.stage === "accepted" && input.role === "provider") {
    return {
      stage: input.stage,
      label: suburb,
      suburb,
      redacted: true,
      reason: "Provider sees operational suburb until driver assignment window.",
    };
  }

  if (
    (input.stage === "assigned" || input.stage === "in_service") &&
    (input.role === "driver" || input.role === "provider")
  ) {
    return {
      stage: input.stage,
      label: input.exactAddress ?? suburb,
      suburb,
      exactAddress: input.exactAddress,
      coordinates: input.coordinates,
      redacted: !input.exactAddress,
      reason: "Exact location available to assigned operational roles in service window.",
    };
  }

  if (input.role === "delegate") {
    return {
      stage: input.stage,
      label: suburb,
      suburb,
      redacted: true,
      reason: "Delegates require explicit authority for exact address (not granted here).",
    };
  }

  return {
    stage: input.stage,
    label: suburb,
    suburb,
    redacted: true,
    reason: "Default deny for exact location.",
  };
}
