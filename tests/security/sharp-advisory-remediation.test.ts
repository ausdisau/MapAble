import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * GHSA-f88m-g3jw-g9cj: sharp < 0.35.0 is high severity via next → sharp.
 * Pin/override must keep production installs on a patched release.
 */
describe("sharp advisory GHSA-f88m-g3jw-g9cj remediation", () => {
  it("overrides sharp to a patched 0.35.x release", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as {
      pnpm?: { overrides?: Record<string, string> };
    };
    const override = pkg.pnpm?.overrides?.sharp;
    expect(override).toBeTruthy();
    expect(override).toMatch(/^0\.35\.\d+/);
  });

  it("lockfile resolves sharp >= 0.35.0", () => {
    const lock = readFileSync(join(process.cwd(), "pnpm-lock.yaml"), "utf8");
    expect(lock).toMatch(/sharp@0\.35\./);
    expect(lock).not.toMatch(/sharp@0\.34\.5/);
  });
});
