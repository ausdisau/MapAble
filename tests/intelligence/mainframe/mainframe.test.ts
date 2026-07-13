import { describe, expect, it } from "vitest";

import {
  syntheticContext,
  syntheticRights,
  syntheticScenarios,
} from "@/lib/intelligence/mainframe/fixtures/care-transport-scenarios";
import { composeSyntheticCareTransportMission } from "@/lib/intelligence/mainframe/missions/care-transport-mission";
import { evaluateMainframePolicy } from "@/lib/intelligence/mainframe/policy/gateway";
import { promptRegistry } from "@/lib/intelligence/mainframe/prompts/registry";

describe("synthetic Intelligence Mainframe", () => {
  it("preserves blocks and access requirements before generating proposals", () => {
    const draft = composeSyntheticCareTransportMission(
      syntheticScenarios.supportedAppointment.goal,
      syntheticRights
    );
    expect(draft.candidateProposals).toHaveLength(1);
    expect(draft.candidateProposals[0]?.workerId).toBe("syn_worker_river");
    expect(draft.candidateProposals[0]?.vehicleId).toBe("syn_vehicle_accessible");
    expect(draft.constraintChecks).toContain("BLOCKED_CANDIDATES_EXCLUDED");
  });

  it("returns clarification when essential detail is absent", () => {
    const draft = composeSyntheticCareTransportMission(
      "I need support and transport to physiotherapy.",
      syntheticRights
    );
    const outcome = evaluateMainframePolicy({
      context: syntheticContext,
      goal: "I need support and transport to physiotherapy.",
      draft,
    });
    expect(outcome.outcome).toBe("CLARIFY");
    expect(outcome.noActionTaken).toBe(true);
  });

  it("escalates prompt injection rather than acting on it", () => {
    const draft = composeSyntheticCareTransportMission(
      syntheticScenarios.injection.goal,
      syntheticRights
    );
    const outcome = evaluateMainframePolicy({
      context: syntheticScenarios.injection.context,
      goal: syntheticScenarios.injection.goal,
      draft,
    });
    expect(outcome.outcome).toBe("ESCALATE");
    expect(outcome.reasonCodes).toContain("UNTRUSTED_INSTRUCTION_SIGNAL");
  });

  it("keeps prompt manifests versioned and hashed", () => {
    for (const prompt of Object.values(promptRegistry)) {
      expect(prompt.manifest.version).toBe("1.0.0");
      expect(prompt.manifest.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(prompt.manifest.allowedDataClasses).toEqual(["SYNTHETIC"]);
    }
  });
});
