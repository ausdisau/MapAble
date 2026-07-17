import { afterEach, describe, expect, it } from "vitest";

import {
  ACCESS_CONCLUSION_STATES,
  ACCESS_ONTOLOGY_V1,
  ACCESS_QUERY_AST_VERSION,
  EVIDENCE_CLASS_POLICIES,
  PERMANENT_DENY_FLAGS,
  TEMPORAL_ACCESS_STATES,
  assertClientCannotEnableDenyFlags,
  compileParticipantRequirements,
  executeAccessQuery,
  getHarbourGraph,
  projectGraphToList,
  runSyntheticJourneyPreflight,
  taylorRoom312Query,
  validateAccessQuery,
} from "@/lib/access-intelligence-next";

const FLAG_KEYS = [
  "MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED",
  "MAPABLE_ACCESS_INTELLIGENCE_NEXT_MODE",
  "MAPABLE_ACCESS_ONTOLOGY_ENABLED",
  "MAPABLE_ACCESS_QUERY_LANGUAGE_ENABLED",
  "MAPABLE_LIVING_ACCESS_GRAPH_ENABLED",
] as const;

afterEach(() => {
  for (const k of FLAG_KEYS) delete process.env[k];
});

describe("Access Intelligence Next — ontology", () => {
  it("publishes a versioned ontology with required concept fields", () => {
    expect(ACCESS_ONTOLOGY_V1.version).toBe("1.0.0");
    expect(ACCESS_ONTOLOGY_V1.concepts.length).toBeGreaterThan(10);
    for (const c of ACCESS_ONTOLOGY_V1.concepts) {
      expect(c.id).toMatch(/^(physical|sensory|cognitive_communication|service|digital|transport)\./);
      expect(c.prohibitedInference.length).toBeGreaterThan(0);
      expect(c.reviewOwner).toBeTruthy();
    }
  });

  it("never defines a universal score concept", () => {
    const ids = ACCESS_ONTOLOGY_V1.concepts.map((c) => c.id).join(" ");
    expect(ids.toLowerCase()).not.toMatch(/universal_score|overall_score/);
  });
});

describe("Access Intelligence Next — AQL", () => {
  it("validates Taylor Room 3.12 query", () => {
    const q = taylorRoom312Query();
    expect(q.version).toBe(ACCESS_QUERY_AST_VERSION);
    const v = validateAccessQuery(q);
    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("rejects unknown ontology concepts", () => {
    const q = taylorRoom312Query();
    q.require = [{ ontologyConceptId: "physical.not_a_real_concept", value: true }];
    const v = validateAccessQuery(q);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e.includes("unknown ontology concept"))).toBe(true);
  });

  it("requires participant-editable summary", () => {
    const q = taylorRoom312Query();
    q.participantEditableSummary = "  ";
    expect(validateAccessQuery(q).ok).toBe(false);
  });
});

describe("Access Intelligence Next — compiler", () => {
  it("compiles hard constraints without preference weakening", () => {
    const compiled = compileParticipantRequirements({
      id: "prs-1",
      version: "1",
      participantRef: "fixture:taylor",
      requirements: [
        {
          ontologyConceptId: "physical.step_free",
          kind: "functional",
          value: true,
          source: "participant",
        },
        {
          ontologyConceptId: "sensory.quiet_space",
          kind: "preference",
          value: true,
          source: "participant",
        },
      ],
    });
    expect(compiled.hardConstraints.some((c) => c.ontologyConceptId === "physical.step_free")).toBe(
      true,
    );
    expect(compiled.preferences.some((c) => c.ontologyConceptId === "sensory.quiet_space")).toBe(
      true,
    );
    expect(
      compiled.preferences.some((c) => c.ontologyConceptId === "physical.step_free"),
    ).toBe(false);
  });
});

describe("Access Intelligence Next — Harbour graph", () => {
  it("exposes list alternative for every node", () => {
    const graph = getHarbourGraph();
    expect(graph.synthetic).toBe(true);
    const list = projectGraphToList(graph);
    expect(list).toHaveLength(graph.nodes.length);
    expect(list.every((i) => i.summary.length > 0)).toBe(true);
  });

  it("includes Room 3.12, lift unknown, and staff entrance", () => {
    const ids = getHarbourGraph().nodes.map((n) => n.id);
    expect(ids).toContain("harbour_civic.room_3_12");
    expect(ids).toContain("harbour_civic.lift_a");
    expect(ids).toContain("harbour_civic.entrance_staff");
    const lift = getHarbourGraph().nodes.find((n) => n.id === "harbour_civic.lift_a");
    expect(lift?.temporalState).toBe("unknown");
  });
});

describe("Access Intelligence Next — Scenario A preflight", () => {
  it("returns cannot_confirm with unknowns rather than compatible", () => {
    const result = runSyntheticJourneyPreflight(
      taylorRoom312Query(),
      "fixture:taylor-harbour-v1",
    );
    expect(result.conclusion).toBe("cannot_confirm");
    expect(ACCESS_CONCLUSION_STATES).toContain(result.conclusion);
    expect(result.unknowns.length).toBeGreaterThan(0);
    expect(result.suggestedConfirmation.length).toBeGreaterThan(0);
    expect(result.excludedAlternatives.some((a) => a.includes("entrance_staff"))).toBe(true);
    expect(result.evidenceReferences.length).toBeGreaterThan(0);
    expect(result.limitations.some((l) => /synthetic/i.test(l))).toBe(true);
    expect(result.failedConstraints).toHaveLength(0);
    expect(result.unresolvedConstraints.length).toBeGreaterThan(0);
  });
});

describe("Access Intelligence Next — flags and evidence", () => {
  it("keeps permanent deny flags false", () => {
    expect(PERMANENT_DENY_FLAGS.aiExecution).toBe(false);
    expect(PERMANENT_DENY_FLAGS.universalScore).toBe(false);
    expect(PERMANENT_DENY_FLAGS.diagnosisInference).toBe(false);
  });

  it("blocks client attempts to enable deny flags", () => {
    const blocked = assertClientCannotEnableDenyFlags({
      MAPABLE_ACCESS_AI_EXECUTION_ENABLED: "true",
      MAPABLE_ACCESS_UNIVERSAL_SCORE_ENABLED: "1",
    });
    expect(blocked).toContain("MAPABLE_ACCESS_AI_EXECUTION_ENABLED");
    expect(blocked).toContain("MAPABLE_ACCESS_UNIVERSAL_SCORE_ENABLED");
  });

  it("defines policies for every evidence class", () => {
    expect(Object.keys(EVIDENCE_CLASS_POLICIES).length).toBeGreaterThanOrEqual(13);
    expect(EVIDENCE_CLASS_POLICIES.model_candidate.personalFitUse).toBe("never");
    expect(EVIDENCE_CLASS_POLICIES.synthetic_fixture.limitations.length).toBeGreaterThan(0);
  });

  it("covers temporal vocabulary", () => {
    expect(TEMPORAL_ACCESS_STATES).toContain("stale");
    expect(TEMPORAL_ACCESS_STATES).toContain("temporarily_unavailable");
  });

  it("executes only when synthetic mode flags allow", () => {
    process.env.MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED = "true";
    process.env.MAPABLE_ACCESS_INTELLIGENCE_NEXT_MODE = "synthetic";
    process.env.MAPABLE_ACCESS_QUERY_LANGUAGE_ENABLED = "true";
    const execution = executeAccessQuery({ query: taylorRoom312Query() });
    expect(execution.validationOk).toBe(true);
    expect(execution.result?.conclusion).toBe("cannot_confirm");
  });

  it("refuses execution when next is disabled", () => {
    process.env.MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED = "false";
    const execution = executeAccessQuery({ query: taylorRoom312Query() });
    expect(execution.validationOk).toBe(false);
    expect(execution.result).toBeNull();
  });
});
