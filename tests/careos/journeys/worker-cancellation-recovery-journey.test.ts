import { describe, expect, it } from "vitest";

import {
  assertJourneySafeDefaults,
  orchestrateWorkerCancellationRecoveryJourney,
} from "@/lib/careos/journey-stubs";
import { buildWorkerCancellationRecoveryOptions } from "@/lib/care/worker-cancellation-recovery";

describe("worker cancellation recovery journey", () => {
  it("orchestration stub disables AI and requires confirmation", () => {
    const result = orchestrateWorkerCancellationRecoveryJourney();
    assertJourneySafeDefaults(result);
    expect(result.blockedReason).toMatch(/substitution/i);
  });

  it("recovery plan never offers silent auto-assign options", () => {
    const plan = buildWorkerCancellationRecoveryOptions({
      careShiftId: "shift-1",
      cancelledWorkerId: "worker-1",
    });
    expect(plan.silentSubstitutionForbidden).toBe(true);
    expect(plan.confirmationRequired).toBe(true);
    expect(plan.options.every((o) => !o.autoAssignable)).toBe(true);
    expect(plan.options.every((o) => o.requiresParticipantConfirmation)).toBe(true);
  });
});
