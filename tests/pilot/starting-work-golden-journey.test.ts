import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.hoisted(() => vi.fn());
const eventCreateMock = vi.hoisted(() => vi.fn());
const auditMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    startingWorkJourneyProjection: {
      upsert: upsertMock,
      findUnique: vi.fn(),
    },
    startingWorkJourneyEvent: {
      create: eventCreateMock,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

import { issueOutcomeReceipt } from "@/lib/outcomes/ledger";
import {
  assertCandidateNotConfirmed,
  runGoldenJourney,
} from "@/lib/pilot/starting-work/golden-journey";
import { getStartingWorkLoopStatus } from "@/lib/pilot/starting-work/loop-status";
import { persistStartingWorkJourney } from "@/lib/pilot/starting-work/persist";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MAPABLE_STARTING_WORK_PILOT_ENABLED = "true";
  process.env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED = "true";
  upsertMock.mockResolvedValue({ id: "proj-1", status: "completed_synthetic" });
  eventCreateMock.mockResolvedValue({});
  auditMock.mockResolvedValue(undefined);
});

describe("Starting Work golden journey", () => {
  it("completes normal flow with outcome receipt and no auto-assignment", () => {
    const state = runGoldenJourney({});
    expect(state.blocked).toBe(false);
    expect(state.stepsCompleted).toContain("accountability_preserved");
    expect(state.outcomeReceiptId).toBeTruthy();
    expect(state.readiness?.autoAssignment).toBe(false);
    expect(state.autoAssignment).toBe(false);
    expect(state.productionClaim).toBe("none");
    expect(state.regionalConfirmed).toHaveLength(0);
    expect(assertCandidateNotConfirmed(state)).toBe(true);
    expect(state.dependencyGraph.nodes.length).toBeGreaterThan(5);
    expect(state.stateHonesty.invoice).toBe("invoiced");
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
    expect(state.stateHonesty.transportQuote).toBe("blocked");
  });

  it("does not silently cancel transport on worker cancellation", () => {
    const state = runGoldenJourney({ failureMode: "worker_cancellation" });
    expect(state.blocked).toBe(true);
    expect(state.failureMode).toBe("worker_cancellation");
    expect(state.notices.some((n) => n.toLowerCase().includes("transport"))).toBe(
      true,
    );
  });

  it("marks lift outage as unknown rather than safe", () => {
    const state = runGoldenJourney({ failureMode: "lift_outage" });
    expect(state.blocked).toBe(false);
    expect(state.stateHonesty.accessCast).toBe("unknown");
    expect(state.notices.some((n) => n.toLowerCase().includes("lift"))).toBe(true);
  });

  it("blocks unaccepted handoff", () => {
    const state = runGoldenJourney({ failureMode: "handoff_not_accepted" });
    expect(state.blocked).toBe(true);
    expect(state.failureMode).toBe("handoff_not_accepted");
  });

  it("handles expired offline pack / lost phone without smartphone-only claim", () => {
    const state = runGoldenJourney({ failureMode: "lost_phone" });
    expect(state.stateHonesty.visitPack).toBe("expired");
    expect(state.notices.some((n) => n.includes("human assistance"))).toBe(true);
  });

  it("records invoice mismatch as disputed honesty state", () => {
    const state = runGoldenJourney({ failureMode: "rejected_invoice" });
    expect(state.stateHonesty.invoice).toBe("disputed");
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

  it("persists projection without writing Care/Transport/Billing domains", async () => {
    const state = runGoldenJourney({});
    const persisted = await persistStartingWorkJourney({
      state,
      actorUserId: "tester-1",
    });
    expect(persisted?.durable).toBe(true);
    expect(upsertMock).toHaveBeenCalled();
    const createArg = upsertMock.mock.calls[0]?.[0]?.create;
    expect(createArg.entityRefsJson.notice).toMatch(/canonical/i);
    expect(createArg.productionClaim).toBe("none");
    expect(eventCreateMock).toHaveBeenCalled();
  });

  it("exposes honest loop placeholders for billing claim adapters", () => {
    const loops = getStartingWorkLoopStatus();
    expect(loops.billing.adapter).toBe("placeholder");
    expect(loops.care.worker_readiness).toBe("evidence_linked");
    expect(loops.transport.request).toBe("governed_partial");
  });
});
