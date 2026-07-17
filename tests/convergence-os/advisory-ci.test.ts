import { afterEach, describe, expect, it, vi } from "vitest";

describe("evaluateAdvisoryCiFindings", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is a no-op success when CI gate disabled", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "false");
    vi.stubEnv("MAPABLE_CONVERGENCE_CI_GATE_ENABLED", "false");
    const { evaluateAdvisoryCiFindings } = await import(
      "@/lib/convergence-os/ci/advisory-gate"
    );
    const result = evaluateAdvisoryCiFindings();
    expect(result.mode).toBe("disabled");
    expect(result.exitCode).toBe(0);
    expect(result.blockers).toHaveLength(0);
  });

  it("emits advisory warnings without failing when gate enabled in audit mode", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_CI_GATE_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_MODE", "audit");
    const { evaluateAdvisoryCiFindings } = await import(
      "@/lib/convergence-os/ci/advisory-gate"
    );
    const result = evaluateAdvisoryCiFindings();
    expect(result.mode).toBe("advisory");
    expect(result.exitCode).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.blockers).toHaveLength(0);
  });

  it("can block only in enforced mode for critical categories", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_CI_GATE_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_MODE", "enforced");
    const { evaluateAdvisoryCiFindings } = await import(
      "@/lib/convergence-os/ci/advisory-gate"
    );
    const result = evaluateAdvisoryCiFindings();
    expect(result.mode).toBe("enforced");
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.exitCode).toBe(1);
  });
});
