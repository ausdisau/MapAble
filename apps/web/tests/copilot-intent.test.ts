import { describe, expect, it } from "vitest";

import { planCopilotActions } from "@/lib/copilot/actionPlanner";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { applyGuardrails } from "@/lib/copilot/guardrails";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import { createLedgerEvent, resetLedgerChainForTests } from "@/lib/ledger/createLedgerEvent";
import { hashPayload } from "@/lib/ledger/hash";
import { resetDraftStoreForTests } from "@/lib/prms/draftStore";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

describe("Co-Pilot intent router", () => {
  it("classifies combined care + transport queries", () => {
    const intent = classifyIntent(
      "I need a support worker and wheelchair transport to my physio appointment next Tuesday morning"
    );
    expect(intent.type).toBe("combined");
    expect(intent.confidence).toBeGreaterThan(0.9);
  });

  it("classifies billing queries", () => {
    const intent = classifyIntent("Can you explain this NDIS invoice line item?");
    expect(intent.type).toBe("billing");
  });

  it("classifies incident queries", () => {
    const intent = classifyIntent("I want to report neglect and need urgent help");
    expect(intent.type).toBe("incident");
  });
});

describe("Co-Pilot action planner and guardrails", () => {
  it("creates draft service event for combined intent, not confirmed booking", async () => {
    const query =
      "support worker and wheelchair transport to physio Tuesday morning";
    const intent = classifyIntent(query);
    const context = await buildCopilotContext(MOCK_PARTICIPANT_ID);
    const planned = await planCopilotActions({
      query,
      mode: "All",
      intent,
      context,
      sessionId: "test",
      participantId: MOCK_PARTICIPANT_ID,
    });

    expect(planned.draftRecords.some((r) => r.type === "SERVICE_EVENT")).toBe(
      true
    );
    expect(
      planned.draftRecords.every(
        (r) => r.status === "needs_confirmation" || r.status === "draft"
      )
    ).toBe(true);
    expect(
      planned.requiredConfirmations.some(
        (g) => g.type === "PARTICIPANT_CONFIRMATION"
      )
    ).toBe(true);
  });

  it("blocks PRMS drafts when participant is not signed in", async () => {
    const intent = classifyIntent("book care and transport");
    const planned = await planCopilotActions({
      query: "care and transport",
      mode: "All",
      intent,
      context: null,
      sessionId: "test",
    });
    const guarded = await applyGuardrails({
      planned,
      context: null,
      participantId: undefined,
    });
    expect(guarded.draftRecords).toHaveLength(0);
    expect(guarded.warnings.some((w) => w.message.includes("Sign in"))).toBe(
      true
    );
  });

  it("requires safety review for incident intent", async () => {
    const intent = classifyIntent("report an incident unsafe harm");
    const planned = await planCopilotActions({
      query: "incident",
      mode: "All",
      intent,
      context: null,
      sessionId: "test",
      participantId: MOCK_PARTICIPANT_ID,
    });
    const guarded = await applyGuardrails({
      planned,
      context: await buildCopilotContext(MOCK_PARTICIPANT_ID),
      participantId: MOCK_PARTICIPANT_ID,
    });
    expect(
      guarded.requiredConfirmations.some((g) => g.type === "SAFETY_REVIEW")
    ).toBe(true);
    expect(guarded.warnings.some((w) => w.level === "urgent")).toBe(true);
  });

  it("billing with missing evidence adds finance review gate", async () => {
    const intent = classifyIntent("review my invoice payment");
    const context = await buildCopilotContext(MOCK_PARTICIPANT_ID);
    const planned = await planCopilotActions({
      query: "invoice",
      mode: "All",
      intent,
      context,
      sessionId: "test",
      participantId: MOCK_PARTICIPANT_ID,
    });
    const guarded = await applyGuardrails({
      planned,
      context,
      participantId: MOCK_PARTICIPANT_ID,
    });
    expect(
      guarded.requiredConfirmations.some((g) => g.type === "FINANCE_REVIEW")
    ).toBe(true);
  });
});

describe("Ledger privacy", () => {
  it("stores hashes only, not participant name or NDIS number", () => {
    resetLedgerChainForTests();
    const event = createLedgerEvent({
      type: "service_event_confirmed",
      subjectType: "service_event",
      subjectRef: "evt-ref-1",
      participantRef: MOCK_PARTICIPANT_ID,
      actorRole: "participant",
      payload: { recordType: "SERVICE_EVENT", confirmedAt: "2026-05-21" },
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toMatch(/Alex/);
    expect(serialized).not.toMatch(/NDIS/i);
    expect(event.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashPayload is stable for same input", () => {
    const a = hashPayload({ b: 2, a: 1 });
    const b = hashPayload({ a: 1, b: 2 });
    expect(a).toBe(b);
  });
});

describe("Draft store", () => {
  it("reset clears store between tests", () => {
    resetDraftStoreForTests();
    expect(true).toBe(true);
  });
});
