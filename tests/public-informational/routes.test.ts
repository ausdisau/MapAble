import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EXCLUDED_TRANSACTIONAL_PATH_PREFIXES,
  informationalRoutePaths,
  PUBLIC_INFORMATIONAL_ROUTES,
  PUBLIC_PROGRAMME_EXPLAINER_ROUTES,
} from "@/lib/public-informational/routes";

describe("public informational route allowlist", () => {
  it("includes core marketing/legal/help pages", () => {
    const paths = PUBLIC_INFORMATIONAL_ROUTES.map((r) => r.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/about",
        "/contact",
        "/privacy",
        "/terms",
        "/accessibility-statement",
        "/guides",
        "/resources",
        "/help",
      ]),
    );
  });

  it("keeps sitemap entries aligned for allowlisted routes", () => {
    const sitemapSrc = readFileSync(
      join(process.cwd(), "app/sitemap.ts"),
      "utf8",
    );
    for (const route of [
      ...PUBLIC_INFORMATIONAL_ROUTES,
      ...PUBLIC_PROGRAMME_EXPLAINER_ROUTES,
    ]) {
      if (!route.inSitemap) continue;
      if (route.path === "/") {
        expect(sitemapSrc).toMatch(/""/);
        continue;
      }
      expect(sitemapSrc).toContain(`"${route.path}"`);
    }
  });

  it("does not treat transactional prefixes as informational allowlist members", () => {
    const paths = informationalRoutePaths();
    for (const prefix of EXCLUDED_TRANSACTIONAL_PATH_PREFIXES) {
      expect(paths.some((p) => p === prefix || p.startsWith(`${prefix}/`))).toBe(
        false,
      );
    }
  });

  it("has page modules for each informational path", () => {
    for (const route of PUBLIC_INFORMATIONAL_ROUTES) {
      if (route.path === "/") {
        expect(
          readFileSync(join(process.cwd(), "app/(marketing)/page.tsx"), "utf8")
            .length,
        ).toBeGreaterThan(0);
        continue;
      }
      const pagePath = join(
        process.cwd(),
        "app/(marketing)",
        route.path.slice(1),
        "page.tsx",
      );
      expect(readFileSync(pagePath, "utf8").length).toBeGreaterThan(0);
    }
  });
});
