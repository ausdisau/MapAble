import { afterEach, describe, expect, it, vi } from "vitest";

describe("convergence API gates", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns 404-style disabled response when ConvergenceOS is off", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "false");
    const { requireConvergenceEnabled } = await import(
      "@/lib/platform/convergence-os/gates"
    );
    const res = requireConvergenceEnabled();
    expect(res).toBeInstanceOf(Response);
    expect(res?.status).toBe(404);
  });

  it("allows through when enabled", async () => {
    vi.stubEnv("MAPABLE_CONVERGENCE_OS_ENABLED", "true");
    vi.stubEnv("MAPABLE_CONVERGENCE_DOMAIN_REGISTRY_ENABLED", "true");
    const { requireConvergenceFeature } = await import(
      "@/lib/platform/convergence-os/gates"
    );
    expect(requireConvergenceFeature("domainRegistry")).toBeNull();
  });
});
