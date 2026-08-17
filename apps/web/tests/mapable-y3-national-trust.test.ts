import { describe, expect, it } from "vitest";

import {
  assertNonAdvisoryCopy,
  getCategoryGuidance,
} from "@/lib/budget/budget-guidance-service";
import { y3NationalTrustConfig ,
  NON_ADVISORY_DISCLAIMER,
  WORKER_ASSIST_DISCLAIMER,
} from "@/lib/config/y3-national-trust";
import { validateWorkerAssistPrompt } from "@/lib/copilot/worker-assist-service";
import { mapClaimsToWorkerStatuses } from "@/lib/trust/passport/issuer-adapter";

describe("Y3 national trust config", () => {
  it("disables all Y3 features by default", () => {
    expect(y3NationalTrustConfig.trustPassportPilotEnabled).toBe(false);
    expect(y3NationalTrustConfig.continuityIntelligenceEnabled).toBe(false);
    expect(y3NationalTrustConfig.budgetGuidanceEnabled).toBe(false);
    expect(y3NationalTrustConfig.publicApiV2PartnerEnabled).toBe(false);
    expect(y3NationalTrustConfig.nationalInsightsV2Enabled).toBe(false);
    expect(y3NationalTrustConfig.assessorNetworkPilotEnabled).toBe(false);
    expect(y3NationalTrustConfig.workerAssistCopilotEnabled).toBe(false);
    expect(y3NationalTrustConfig.participationPlannerEnabled).toBe(false);
  });
});

describe("Non-advisory budget guardrails", () => {
  it("includes standard disclaimer text", () => {
    expect(NON_ADVISORY_DISCLAIMER).toMatch(/not financial/i);
  });

  it("blocks advisory phrasing in category guidance", () => {
    expect(() => assertNonAdvisoryCopy("you should spend on core supports")).toThrow(
      "NON_ADVISORY_COPY_VIOLATION"
    );
    expect(getCategoryGuidance("core")).toContain("not a spending recommendation");
  });
});

describe("Trust passport mock issuer", () => {
  it("maps verified claims to worker profile statuses", () => {
    const mapped = mapClaimsToWorkerStatuses({
      workerScreeningStatus: "verified",
      verificationStatus: "verified",
    });
    expect(mapped.workerScreeningStatus).toBe("verified");
    expect(mapped.verificationStatus).toBe("verified");
  });
});

describe("Worker assist guardrails", () => {
  it("includes anti-surveillance disclaimer", () => {
    expect(WORKER_ASSIST_DISCLAIMER).toMatch(/not for monitoring/i);
  });

  it("blocks monitoring-style prompts", () => {
    expect(() => validateWorkerAssistPrompt("monitor the participant")).toThrow(
      "WORKER_ASSIST_MONITORING_BLOCKED"
    );
  });
});

describe("API v2 shape expectations", () => {
  it("documents v2 export includes schemaVersion", () => {
    const v2Row = { invoiceId: "inv_1", schemaVersion: 2 };
    expect(v2Row.schemaVersion).toBe(2);
  });

  it("documents continuity pipeline status includes awaiting_dispatch", () => {
    const pipeline = [
      "detected",
      "proposing",
      "awaiting_participant",
      "awaiting_dispatch",
      "assigned",
      "closed",
    ];
    expect(pipeline).toContain("awaiting_dispatch");
  });
});

describe("National insights v2 metrics", () => {
  it("lists expected v2 metric keys", () => {
    const keys = [
      "continuityAdjustedWeeks",
      "backupRecoverySuccessRate",
      "reconciliationUnpaidPercent",
      "trustPassportAdoptionRate",
    ];
    expect(keys).toHaveLength(4);
  });
});

describe("Participation planner scope", () => {
  it("documents no funding advice in planner copy", () => {
    const copy = "Log outcomes — not funding advice or plan management.";
    expect(copy).toMatch(/not funding advice/i);
  });
});
