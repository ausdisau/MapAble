import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EXCLUDED_TRANSACTIONAL_PATH_PREFIXES,
  INFORMATIONAL_SAFE_CTAS,
  informationalRoutePaths,
  informationalSitemapPaths,
  PUBLIC_INFORMATIONAL_ROUTES,
  PUBLIC_PROGRAMME_EXPLAINER_ROUTES,
} from "@/lib/public/informational/routes";
import { homepageHeroCtas } from "@/lib/marketing/mapable-care-combined-data";

describe("public informational route allowlist (canonical)", () => {
  it("includes core marketing/legal/help pages with release metadata", () => {
    for (const route of PUBLIC_INFORMATIONAL_ROUTES) {
      expect(route.authenticationProhibited).toBe(true);
      expect(route.titleIncludes.length).toBeGreaterThan(0);
      expect(route.h1Includes.length).toBeGreaterThan(0);
    }
    expect(PUBLIC_INFORMATIONAL_ROUTES.map((r) => r.path)).toEqual(
      expect.arrayContaining([
        "/",
        "/about",
        "/contact",
        "/privacy",
        "/terms",
        "/accessibility-statement",
      ]),
    );
  });

  it("wires sitemap generation to the informational inventory", () => {
    const sitemapSrc = readFileSync(
      join(process.cwd(), "app/sitemap.ts"),
      "utf8",
    );
    expect(sitemapSrc).toMatch(/informationalSitemapPaths/);
    for (const path of informationalSitemapPaths()) {
      if (path === "") continue;
      // Inventory paths must remain representable; additional routes may exist.
      expect(
        [...PUBLIC_INFORMATIONAL_ROUTES, ...PUBLIC_PROGRAMME_EXPLAINER_ROUTES]
          .map((r) => r.path)
          .includes(path),
      ).toBe(true);
    }
  });

  it("keeps homepage hero CTAs inside the informational-safe set", () => {
    const allowed = new Set(
      INFORMATIONAL_SAFE_CTAS.map((c) => c.href as string),
    );
    const excluded = EXCLUDED_TRANSACTIONAL_PATH_PREFIXES as readonly string[];
    for (const cta of homepageHeroCtas) {
      const href = cta.href as string;
      expect(allowed.has(href)).toBe(true);
      expect(excluded.some((p) => href === p || href.startsWith(`${p}/`))).toBe(
        false,
      );
    }
  });

  it("does not treat transactional prefixes as informational allowlist members", () => {
    const paths = informationalRoutePaths();
    for (const prefix of EXCLUDED_TRANSACTIONAL_PATH_PREFIXES) {
      expect(
        paths.some((p) => p === prefix || p.startsWith(`${prefix}/`)),
      ).toBe(false);
    }
  });

  it("exports inventory for a11y suite consumption", () => {
    const a11ySrc = readFileSync(
      join(process.cwd(), "tests/a11y/informational-routes.spec.ts"),
      "utf8",
    );
    expect(a11ySrc).toMatch(/INFORMATIONAL_RELEASE_ROUTES/);
  });
});
