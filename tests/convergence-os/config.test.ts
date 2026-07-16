import { afterEach, describe, expect, it, vi } from "vitest";

describe("convergenceOsConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to disabled audit mode with no auto mutation", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", undefined);
    vi.stubEnv("MAPABLE_CONVERGENCE_MODE", undefined);
    const mod = await import("@/lib/config/convergence-os");
    expect(mod.convergenceOsConfig.enabled).toBe(false);
    expect(mod.convergenceOsConfig.mode).toBe("audit");
    expect(mod.convergenceOsConfig.autoMergeEnabled).toBe(false);
    expect(mod.convergenceOsConfig.autoMigrationEnabled).toBe(false);
    expect(mod.isConvergenceEnforcementActive()).toBe(false);
  });

  it("does not treat presence of flags as production availability", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_DOMAIN_REGISTRY_ENABLED", "true");
    const mod = await import("@/lib/config/convergence-os");
    expect(mod.isConvergenceOsEnabled()).toBe(true);
    expect(mod.isConvergenceDomainRegistryEnabled()).toBe(true);
    expect(mod.convergenceOsConfig.autoMergeEnabled).toBe(false);
  });

  it("defaults Iteration 2 flags to disabled", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "true");
    const mod = await import("@/lib/config/convergence-os");
    expect(mod.isConvergenceTwinEnabled()).toBe(false);
    expect(mod.isConvergenceConstitutionEnabled()).toBe(false);
    expect(mod.isConvergenceFederationEnabled()).toBe(false);
  });

  it("enables twin only when both master and twin flags are true", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_TWIN_ENABLED", "true");
    const mod = await import("@/lib/config/convergence-os");
    expect(mod.isConvergenceTwinEnabled()).toBe(true);
  });
});
