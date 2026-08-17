import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const criticalPublicRoutes = [
  "app/(marketing)/page.tsx",
  "app/care/page.tsx",
  "app/transport/page.tsx",
  "app/employment/page.tsx",
  "app/accessibility-map/page.tsx",
  "app/dashboard/page.tsx",
  "app/(marketing)/providers/page.tsx",
  "app/(marketing)/resources/page.tsx",
  "app/journey-planner/page.tsx",
  "app/compare/page.tsx",
  "app/mapping-days/page.tsx",
  "app/add-access-info/page.tsx",
  "app/verify-my-venue/page.tsx",
  "app/provider-growth/page.tsx",
  "app/access-intelligence/page.tsx",
  "app/access-pass/page.tsx",
  "app/access/[location]/page.tsx",
  "app/accessibility-map/[slug]/page.tsx",
];

describe("competitor-upgrade public route health", () => {
  it("has page files for critical public routes", () => {
    for (const routeFile of criticalPublicRoutes) {
      expect(existsSync(join(process.cwd(), routeFile)), `${routeFile} should exist`).toBe(
        true,
      );
    }
  });

  it("does not leave /accessibility-map as a redirect-only stub", () => {
    const source = readFileSync(
      join(process.cwd(), "app/accessibility-map/page.tsx"),
      "utf8",
    );
    expect(source).not.toContain('redirect("/access")');
    expect(source).toContain("AccessibilityMapLanding");
  });

  it("keeps providers as a directory surface rather than thin info-only CTA", () => {
    const source = readFileSync(
      join(process.cwd(), "app/(marketing)/providers/page.tsx"),
      "utf8",
    );
    expect(source).toContain("ProviderDirectory");
  });

  it("includes new competitor routes in the sitemap", () => {
    const source = readFileSync(join(process.cwd(), "app/sitemap.ts"), "utf8");
    for (const route of [
      "/accessibility-map",
      "/journey-planner",
      "/compare",
      "/mapping-days",
      "/add-access-info",
      "/verify-my-venue",
      "/provider-growth",
      "/access-intelligence",
      "/access-pass",
    ]) {
      expect(source).toContain(`"${route}"`);
    }
  });

  it("provides accessible error fallbacks", () => {
    expect(existsSync(join(process.cwd(), "app/not-found.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/error.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app/global-error.tsx"))).toBe(true);
  });
});
