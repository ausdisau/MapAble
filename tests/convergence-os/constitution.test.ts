import { describe, expect, it } from "vitest";
import { CONSTITUTION_RULES } from "@/lib/convergence-os/constitution/rules";
import { allowedTransitions } from "@/lib/convergence-os/constitution/exceptions";

describe("Architecture Constitution", () => {
  it("seeds exactly C-001 through C-025", () => {
    expect(CONSTITUTION_RULES).toHaveLength(25);
    const keys = CONSTITUTION_RULES.map((r) => r.ruleKey);
    expect(keys[0]).toBe("C-001");
    expect(keys[24]).toBe("C-025");
    expect(new Set(keys).size).toBe(25);
  });

  it("keeps exception transitions human-governed", () => {
    expect(allowedTransitions("draft")).toContain("submitted");
    expect(allowedTransitions("approved")).toContain("expired");
    expect(allowedTransitions("closed")).toEqual([]);
  });
});
