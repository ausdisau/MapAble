import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const publicRouteFiles = [
  "app/(marketing)/page.tsx",
  "app/care/page.tsx",
  "app/transport/page.tsx",
  "app/employment/page.tsx",
  "app/marketplace/page.tsx",
  "app/foods/page.tsx",
  "app/access/page.tsx",
  "app/(marketing)/peer/page.tsx",
  "app/(marketing)/telehealth/page.tsx",
  "app/(marketing)/providers/page.tsx",
  "app/(marketing)/resources/page.tsx",
  "app/(marketing)/help/page.tsx",
  "app/(marketing)/privacy/page.tsx",
  "app/(marketing)/terms/page.tsx",
  "app/(marketing)/data-deletion/page.tsx",
  "app/(marketing)/accessibility-statement/page.tsx",
  "app/(marketing)/for-providers/page.tsx",
  "app/(marketing)/pricing/page.tsx",
  "app/(marketing)/about/page.tsx",
  "app/(marketing)/contact/page.tsx",
];

/** Public marketing-shell modules (no auth guards in layout). */
const publicModuleLayouts = [
  "app/care/layout.tsx",
  "app/transport/layout.tsx",
  "app/employment/layout.tsx",
  "app/foods/layout.tsx",
];

/** Marketplace remains session-gated (not a marketing-shell public module). */
const authGatedModuleLayouts = ["app/marketplace/layout.tsx"];

describe("Phase 0 public route contract", () => {
  it("has a page file for every required public route", () => {
    for (const routeFile of publicRouteFiles) {
      expect(
        existsSync(join(process.cwd(), routeFile)),
        `${routeFile} should exist`,
      ).toBe(true);
    }
  });

  it("uses the marketing shell for module layouts without auth guards", () => {
    for (const layoutFile of publicModuleLayouts) {
      const source = readFileSync(join(process.cwd(), layoutFile), "utf8");
      expect(source).toContain("MapAbleCareMarketingShell");
      expect(source).not.toContain("requirePermission");
      expect(source).not.toContain("requireAuth");
    }
  });

  it("keeps marketplace layout session-gated (not marketing shell)", () => {
    for (const layoutFile of authGatedModuleLayouts) {
      const source = readFileSync(join(process.cwd(), layoutFile), "utf8");
      expect(source).toContain("requireAuth");
      expect(source).not.toContain("MapAbleCareMarketingShell");
    }
  });

  it("exports public pages without server auth guards", async () => {
    for (const pageFile of [
      "app/care/page.tsx",
      "app/(marketing)/about/page.tsx",
      "app/(marketing)/privacy/page.tsx",
    ]) {
      const source = readFileSync(join(process.cwd(), pageFile), "utf8");
      expect(source).not.toContain("requirePermission");
      expect(source).not.toContain("requireAuth");
    }

    const careModule = await import("@/app/care/page");
    const aboutModule = await import("@/app/(marketing)/about/page");
    expect(typeof careModule.default).toBe("function");
    expect(typeof aboutModule.default).toBe("function");
  });
});
