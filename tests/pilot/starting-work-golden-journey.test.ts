import { describe, expect, it } from "vitest";

import { issueOutcomeReceipt } from "@/lib/outcomes/ledger";
import {
  assertCandidateNotConfirmed,
  runGoldenJourney,
} from "@/lib/pilot/starting-work/golden-journey";
import { getStartingWorkLoopStatus } from "@/lib/pilot/starting-work/loop-status";

describe("Starting Work golden journey", () => {
  it("completes normal flow with outcome receipt and no auto-assignment", () => {
    const state = runGoldenJourney({});
    expect(state.blocked).toBe(false);
    expect(state.stepsCompleted).toContain("accountability_preserved");
    expect(state.outcomeReceiptId).toBeTruthy();
    expect(state.readiness?.autoAssignment).toBe(false);
    expect(state.regionalConfirmed).toHaveLength(0);
    expect(assertCandidateNotConfirmed(state)).toBe(true);
  });

  it("fails closed on expired consent", () => {
    const state = runGoldenJourney({ failureMode: "expired_consent" });
    expect(state.blocked).toBe(true);
    expect(state.failureMode).toBe("expired_consent");
    expect(state.stepsCompleted).not.toContain("transport_authorised");
  });

  it("blocks stale credentials without assigning", () => {
    const state = runGoldenJourney({ failureMode: "stale_credential" });
    expect(state.blocked).toBe(true);
    expect(state.readiness?.ready).toBe(false);
    expect(state.readiness?.autoAssignment).toBe(false);
  });

  it("keeps inaccessible vehicle from becoming authorised transport", () => {
    const state = runGoldenJourney({ failureMode: "inaccessible_vehicle" });
    expect(state.blocked).toBe(true);
    expect(state.stepsCompleted).not.toContain("transport_authorised");
  });

  it("records declined outcome review without inventing a success score", () => {
    const state = runGoldenJourney({
      failureMode: "participant_declines_outcome_review",
    });
    expect(state.outcomeReceiptId).toBeTruthy();
    const receipt = issueOutcomeReceipt({
      participantId: "taylor-synthetic",
      goalStatement: "goal",
      participantDeclinedReview: true,
    });
    expect(receipt.participantDeclinedReview).toBe(true);
    expect(JSON.stringify(receipt)).not.toMatch(/score/i);
  });

  it("exposes honest loop placeholders for billing claim adapters", () => {
    const loops = getStartingWorkLoopStatus();
    expect(loops.billing.adapter).toBe("placeholder");
    expect(loops.care.worker_readiness).toBe("evidence_linked");
    expect(loops.transport.request).toBe("governed_partial");
  });
});
