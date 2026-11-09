import { describe, expect, it } from "vitest";

import {
  describeLocalPreviewChoice,
  describeSupportStatus,
} from "../../lib/my-support/support-status";

describe("My Support evidence labelling", () => {
  it("does not turn a pending care request into a confirmed visit", () => {
    const status = describeSupportStatus("care", "pending_provider");
    expect(status.category).toBe("awaiting");
    expect(status.label).toMatch(/Awaiting/);
  });

  it("does not equate worker allocation with attendance or verified screening", () => {
    const status = describeSupportStatus("care", "worker_assigned");
    expect(status.category).toBe("arranged");
    expect(status.detail).toMatch(/not prove current screening/);
  });

  it("does not equate transport dispatch with a confirmed accessible pickup", () => {
    const status = describeSupportStatus("transport", "dispatch_pending");
    expect(status.category).toBe("arranged");
    expect(status.detail).toMatch(/not yet confirmed/);
  });

  it("does not make a completed record into proof of delivered support", () => {
    const status = describeSupportStatus("care", "completed");
    expect(status.category).toBe("recorded_complete");
    expect(status.label).toMatch(/Marked/);
  });

  it("fails closed on unknown source states", () => {
    expect(describeSupportStatus("transport", "imaginary_state").category).toBe("unknown");
    expect(describeSupportStatus("care", "").category).toBe("unknown");
  });

  it("avoids attributing fault to participants when a trip does not proceed", () => {
    const status = describeSupportStatus("transport", "participant_no_show");
    expect(status.detail).toMatch(/Do not infer responsibility or fault/);
  });

  it("does not imply substitute workers are already accepted", () => {
    expect(describeLocalPreviewChoice("decline_replacement")).toMatch(/unmet support need remains/);
    expect(describeLocalPreviewChoice("request_human")).toMatch(/without approving/);
  });
});
