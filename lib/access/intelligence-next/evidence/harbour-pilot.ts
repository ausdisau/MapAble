/**
 * Controlled real-source-shaped pilot fixtures for Harbour Civic Centre.
 * Synthetic subject refs only — no safety guarantee, no auto-publication.
 */

export const HARBOUR_PILOT = {
  venueCanonicalRef: "accessplace:synthetic:harbour_civic",
  placeNodeId: "harbour_civic.place",
  entranceNodeId: "harbour_civic.entrance_west",
  liftNodeId: "harbour_civic.lift_a",
  destinationRoomNodeId: "harbour_civic.room_3_12",
  productionClaim: "none" as const,
  notice:
    "Harbour Civic Centre pilot uses synthetic canonical refs. Venue status is authenticated only when an authorised human writes an envelope with explicit expiry. No safety guarantee.",
} as const;

export const HARBOUR_PILOT_FEATURES = [
  {
    subjectNodeId: HARBOUR_PILOT.entranceNodeId,
    ontologyConceptId: "physical.minimum_clear_width_mm",
    featureKey: "entrance.clear_width_mm",
    summary: "West entrance clear width observation (pilot)",
  },
  {
    subjectNodeId: HARBOUR_PILOT.liftNodeId,
    ontologyConceptId: "physical.lift_operational",
    featureKey: "lift.operational",
    summary: "Lift A operational status (pilot)",
  },
  {
    subjectNodeId: HARBOUR_PILOT.destinationRoomNodeId,
    ontologyConceptId: "physical.step_free",
    featureKey: "room.step_free_access",
    summary: "Room 3.12 step-free access observation (pilot)",
  },
] as const;
