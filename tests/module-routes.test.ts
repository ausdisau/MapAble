import { describe, expect, it } from "vitest";

import { modules } from "@/app/lib/modules";

const ROUTE_FILES: Record<string, string[]> = {
  "/care": ["app/care/page.tsx"],
  "/transport": ["app/transport/page.tsx"],
  "/dashboard/jobs": ["app/dashboard/jobs/page.tsx"],
};

describe("MapAble module registry routes", () => {
  it("every module href resolves to a known route", () => {
    for (const mod of modules) {
      expect(
        ROUTE_FILES[mod.href],
        `missing route mapping for ${mod.key} → ${mod.href}`,
      ).toBeDefined();
    }
  });
});
