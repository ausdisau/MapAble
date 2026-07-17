import { describe, expect, it } from "vitest";

import {
  assertCanTransition,
  canEditAmounts,
  isTransitionAllowed,
  plainLanguageStatus,
} from "@/lib/billing/invoicing/state-machine";

describe("invoice state machine", () => {
  it("allows draft to participant_review", () => {
    expect(isTransitionAllowed("draft", "participant_review")).toBe(true);
  });

  it("blocks paid to draft", () => {
    expect(isTransitionAllowed("paid", "draft")).toBe(false);
  });

  it("requires permission and reason for void", () => {
    expect(() =>
      assertCanTransition({
        from: "draft",
        to: "void",
        actorPermissions: ["billing:edit_draft"],
        reason: "mistake",
      })
    ).toThrow(/permission/i);

    expect(() =>
      assertCanTransition({
        from: "draft",
        to: "void",
        actorPermissions: ["billing:void_invoice"],
      })
    ).toThrow(/reason/i);

    expect(
      assertCanTransition({
        from: "draft",
        to: "void",
        actorPermissions: ["billing:void_invoice"],
        reason: "Duplicate draft",
      }).to
    ).toBe("void");
  });

  it("locks amounts after issue", () => {
    expect(canEditAmounts("draft")).toBe(true);
    expect(canEditAmounts("issued")).toBe(false);
    expect(canEditAmounts("paid")).toBe(false);
  });

  it("provides plain-language status", () => {
    expect(plainLanguageStatus("policy_review_required")).toMatch(/policy/i);
    expect(plainLanguageStatus("disputed")).toMatch(/question/i);
  });
});
