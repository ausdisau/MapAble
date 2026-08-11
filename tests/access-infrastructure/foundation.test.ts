import { describe, expect, it } from "vitest";

import {
  ACCESS_COMPATIBILITY_STATES,
  ACCESS_DOMAINS,
  ACCESS_JOURNEY_SEGMENT_KINDS,
  ACCESS_PROVENANCE_STATUSES,
  mapConclusionToCompatibility,
} from "@/lib/access/infrastructure";
import {
  ACCESS_ONTOLOGY_CURRENT,
  ACCESS_ONTOLOGY_V1,
  ACCESS_ONTOLOGY_V2,
  getOntologyConcept,
  resolveOntologyConceptId,
} from "@/lib/access/intelligence-next";

describe("Access as Infrastructure — domains", () => {
  it("publishes exactly twenty canonical domains", () => {
    expect(ACCESS_DOMAINS).toHaveLength(20);
    expect(new Set(ACCESS_DOMAINS).size).toBe(20);
  });

  it("covers whole-journey segment kinds", () => {
    expect(ACCESS_JOURNEY_SEGMENT_KINDS).toContain("preparation");
    expect(ACCESS_JOURNEY_SEGMENT_KINDS).toContain("return_journey");
    expect(ACCESS_JOURNEY_SEGMENT_KINDS.length).toBeGreaterThanOrEqual(14);
  });

  it("defines provenance and four-state compatibility vocabularies", () => {
    expect(ACCESS_PROVENANCE_STATUSES).toContain("verified");
    expect(ACCESS_PROVENANCE_STATUSES).toContain("disputed");
    expect(ACCESS_COMPATIBILITY_STATES).toEqual([
      "compatible",
      "compatible_with_adjustment",
      "uncertain",
      "incompatible",
    ]);
  });
});

describe("Access as Infrastructure — ontology v2", () => {
  it("publishes current ontology as v2 framework seed", () => {
    expect(ACCESS_ONTOLOGY_CURRENT.version).toBe("2.0.0");
    expect(ACCESS_ONTOLOGY_CURRENT.framework).toBe("access_as_infrastructure");
    expect(ACCESS_ONTOLOGY_V2.concepts.length).toBeGreaterThan(ACCESS_ONTOLOGY_V1.concepts.length);
  });

  it("never defines a universal score concept", () => {
    const ids = ACCESS_ONTOLOGY_CURRENT.concepts.map((c) => c.id).join(" ");
    expect(ids.toLowerCase()).not.toMatch(/universal_score|overall_score/);
  });

  it("resolves v1 concept aliases to v2 ids", () => {
    expect(resolveOntologyConceptId("physical.step_free")).toBe("mobility_movement.step_free");
    expect(getOntologyConcept("physical.step_free")?.id).toBe("mobility_movement.step_free");
    expect(getOntologyConcept("mobility_movement.step_free")?.domain).toBe("mobility_movement");
  });

  it("keeps prohibited inference on every concept", () => {
    for (const c of ACCESS_ONTOLOGY_CURRENT.concepts) {
      expect(c.prohibitedInference.length).toBeGreaterThan(0);
      expect(c.prohibitedInference.join(" ")).toMatch(/diagnosis|certified|compliance|popularity|score|always|alone|unverified|pet|building_class|mobile_app|booking_created|vehicle_type|accessible_toilet|accessible_entrance|staff_always|safe_for_all|vision_estimate|photo_without_scale|static_geometry|alternative_entrance|independent_access|dda_compliance|sensory_tolerance/i);
    }
  });

  it("spans multiple Access Infrastructure domains", () => {
    const domains = new Set(ACCESS_ONTOLOGY_CURRENT.concepts.map((c) => c.domain));
    expect(domains.has("mobility_movement")).toBe(true);
    expect(domains.has("hearing")).toBe(true);
    expect(domains.has("transport")).toBe(true);
    expect(domains.has("emergency")).toBe(true);
    expect(domains.size).toBeGreaterThanOrEqual(12);
  });
});

describe("Access as Infrastructure — compatibility mapping", () => {
  it("maps proof-carrying states without collapsing unknown to inaccessible", () => {
    expect(mapConclusionToCompatibility("compatible")).toBe("compatible");
    expect(mapConclusionToCompatibility("fallback_available")).toBe("compatible_with_adjustment");
    expect(mapConclusionToCompatibility("cannot_confirm")).toBe("uncertain");
    expect(mapConclusionToCompatibility("stale")).toBe("uncertain");
    expect(mapConclusionToCompatibility("blocked_by_hard_requirement")).toBe("incompatible");
  });
});
