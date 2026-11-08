import { describe, expect, it } from "vitest";

import { assessDayPlan, recoveryProposalsFor } from "@/lib/day/day-planner";
import {
  makeSyntheticDayPlan,
  MAPABLE_DAY_SCENARIOS,
} from "@/lib/day/synthetic-fixtures";

function statusFor(
  scenarioId: Parameters<typeof makeSyntheticDayPlan>[0],
  activityId: string,
) {
  const output = assessDayPlan(makeSyntheticDayPlan(scenarioId));
  const result = output.activities.find((item) => item.activityId === activityId);
  if (!result) throw new Error("MISSING_TEST_ACTIVITY");
  return result;
}

describe("MapAble Day v0.1 LifeVal-inspired synthetic evaluations", () => {
  it("includes the five reproducible starting states", () => {
    expect(MAPABLE_DAY_SCENARIOS).toHaveLength(5);
  });

  it("does not claim optional participation is confirmed", () => {
    expect(statusFor("baseline", "community").readiness).toBe("review");
    expect(statusFor("baseline", "morning-care").readiness).toBe("ready");
  });

  it("propagates worker cancellation through dependent transport and appointment", () => {
    expect(statusFor("worker_cancelled", "morning-care").readiness).toBe("blocked");
    expect(statusFor("worker_cancelled", "outbound-trip").readiness).toBe("blocked");
    expect(statusFor("worker_cancelled", "appointment").readiness).toBe("blocked");
    expect(statusFor("worker_cancelled", "return-trip").readiness).toBe("blocked");
    expect(statusFor("worker_cancelled", "lunch").readiness).toBe("ready");
  });

  it("does not describe inaccessible transport as ready", () => {
    expect(statusFor("transport_issue", "outbound-trip").readiness).toBe("blocked");
    expect(statusFor("transport_issue", "appointment").readiness).toBe("blocked");
    expect(statusFor("transport_issue", "morning-care").readiness).toBe("ready");
  });

  it("does not disregard required AAC acknowledgement", () => {
    const finding = statusFor("aac_unconfirmed", "morning-care");
    expect(finding.readiness).toBe("blocked");
    expect(finding.reasons.join(" ")).toMatch(/communication/i);
  });

  it("escalates rather than inferring an eligible available worker", () => {
    const finding = statusFor("no_verified_worker", "morning-care");
    expect(finding.readiness).toBe("blocked");
    expect(finding.reasons.join(" ")).toMatch(/not been verified/i);
    expect(assessDayPlan(makeSyntheticDayPlan("no_verified_worker")).humanReviewRequired).toBe(true);
  });

  it("never grants sharing or delegation implicitly", () => {
    const plan = makeSyntheticDayPlan("baseline");
    expect(plan.participantControls).toEqual({
      changeApprovalRequired: true,
      delegationNotAssumed: true,
      sharingNotGrantedByDefault: true,
    });
    expect(plan.dataSource).toBe("synthetic");
  });

  it("all recovery proposals are non-executing and require participant confirmation", () => {
    for (const scenario of MAPABLE_DAY_SCENARIOS) {
      const plan = makeSyntheticDayPlan(scenario.id);
      for (const activity of plan.activities) {
        const proposals = recoveryProposalsFor(activity);
        expect(proposals.length).toBeGreaterThan(0);
        expect(
          proposals.every(
            (proposal) =>
              proposal.requiresParticipantConfirmation &&
              !proposal.autoAssignsWorkerOrTransport &&
              !proposal.changesExternalRecords,
          ),
        ).toBe(true);
      }
    }
  });

  it("handles missing dependencies, forbidding invented completion", () => {
    const plan = makeSyntheticDayPlan("baseline");
    const appointment = plan.activities.find((item) => item.id === "appointment");
    if (!appointment) throw new Error("MISSING_FIXTURE");
    appointment.dependsOn = ["unavailable-trip"];
    expect(assessDayPlan(plan).activities.find((item) => item.activityId === "appointment")?.readiness).toBe("blocked");
  });

  it("detects circular dependencies and prevents ready state", () => {
    const plan = makeSyntheticDayPlan("baseline");
    const care = plan.activities.find((item) => item.id === "morning-care");
    if (!care) throw new Error("MISSING_FIXTURE");
    care.dependsOn = ["appointment"];
    expect(assessDayPlan(plan).allConfirmedAndReady).toBe(false);
    expect(assessDayPlan(plan).humanReviewRequired).toBe(true);
  });

  it("does not mutate participant's input plan while evaluating", () => {
    const plan = makeSyntheticDayPlan("worker_cancelled");
    const before = JSON.stringify(plan);
    assessDayPlan(plan);
    expect(JSON.stringify(plan)).toBe(before);
  });
});
