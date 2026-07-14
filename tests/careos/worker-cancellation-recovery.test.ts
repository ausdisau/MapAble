import { describe, expect, it } from "vitest";

import {
  assertRecoveryOptionRequiresConfirmation,
  buildWorkerCancellationRecoveryOptions,
} from "@/lib/care/worker-cancellation-recovery";

describe("worker cancellation recovery service", () => {
  it("returns deterministic options sorted by sortOrder", () => {
    const plan = buildWorkerCancellationRecoveryOptions({
      careShiftId: "shift-abc",
      cancelledWorkerId: "worker-xyz",
    });
    expect(plan.options).toHaveLength(3);
    expect(plan.options.map((o) => o.optionKey)).toEqual([
      "review_backup_candidates",
      "request_human_coordination",
      "reschedule_with_approval",
    ]);
    expect(plan.options[0]!.sortOrder).toBeLessThan(plan.options[1]!.sortOrder);
  });

  it("forbids silent substitution at plan level", () => {
    const plan = buildWorkerCancellationRecoveryOptions({
      careShiftId: "shift-abc",
    });
    expect(plan.silentSubstitutionForbidden).toBe(true);
    expect(plan.confirmationRequired).toBe(true);
  });

  it("rejects options that would auto-assign without confirmation", () => {
    const plan = buildWorkerCancellationRecoveryOptions({
      careShiftId: "shift-abc",
    });
    for (const option of plan.options) {
      expect(() => assertRecoveryOptionRequiresConfirmation(option)).not.toThrow();
    }
    expect(() =>
      assertRecoveryOptionRequiresConfirmation({
        ...plan.options[0]!,
        autoAssignable: true as never,
      }),
    ).toThrow("SILENT_SUBSTITUTION_FORBIDDEN");
  });
});
