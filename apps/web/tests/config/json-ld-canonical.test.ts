import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getCanonicalPublicOrigin,
} from "@/lib/config/canonical-url";
import {
  buildPublicJsonLd,
  serializeJsonLdForScript,
} from "@/lib/config/json-ld";

describe("canonical public URL surfaces", () => {
  it("builds JSON-LD Organization/WebSite/SearchAction with apex origin", () => {
    const { organization, website } = buildPublicJsonLd({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
    } as NodeJS.ProcessEnv);

    expect(organization.url).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect(organization.sameAs).toBeUndefined();
    expect(website.url).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect((website.potentialAction as { target: string }).target).toBe(
      `${CANONICAL_PRODUCTION_ORIGIN}/provider-finder?q={search_term_string}`,
    );
    expect(JSON.stringify(organization)).not.toContain("www.mapable.com.au");
    expect(JSON.stringify(website)).not.toContain("localhost");
  });

  it("defaults JSON-LD to apex in production when unset", () => {
    const { organization } = buildPublicJsonLd({
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv);
    expect(organization.url).toBe(CANONICAL_PRODUCTION_ORIGIN);
  });

  it("escapes script-breaking characters in JSON-LD serialization", () => {
    const malicious = {
      name: "</script><script>alert(1)</script>",
      amp: "a & b",
      line: "line\u2028sep\u2029",
    };
    const serialized = serializeJsonLdForScript(malicious);
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script>");
    expect(serialized).toContain("\\u003c");
    expect(serialized).toContain("\\u003e");
    expect(serialized).toContain("\\u0026");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
    expect(
      JSON.parse(
        serialized
          .replace(/\\u003c/g, "<")
          .replace(/\\u003e/g, ">")
          .replace(/\\u0026/g, "&"),
      ),
    ).toMatchObject({
      amp: "a & b",
    });
  });

  it("robots and sitemap modules call the shared canonical resolver", async () => {
    const fs = await import("node:fs");
    const robotsSrc = fs.readFileSync("app/robots.ts", "utf8");
    const sitemapSrc = fs.readFileSync("app/sitemap.ts", "utf8");
    const layoutSrc = fs.readFileSync("app/layout.tsx", "utf8");
    expect(robotsSrc).toMatch(/getCanonicalPublicOrigin/);
    expect(sitemapSrc).toMatch(/getCanonicalPublicOrigin/);
    expect(layoutSrc).toMatch(/buildPublicJsonLd/);
    expect(layoutSrc).toMatch(/JsonLd/);
    expect(layoutSrc).toMatch(/lang="en-AU"/);
    expect(layoutSrc).toMatch(/MapAble Australia/);
    expect(layoutSrc).not.toMatch(/www\.mapable\.com\.au/);
  });

  it("production resolver never returns localhost or www fallback", () => {
    expect(
      getCanonicalPublicOrigin({
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).toBe(CANONICAL_PRODUCTION_ORIGIN);

    const origin = getCanonicalPublicOrigin({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
    } as NodeJS.ProcessEnv);
    expect(robots).toEqual(expect.any(Function));
    expect(sitemap).toEqual(expect.any(Function));
    expect(origin).toBe("https://mapable.com.au");
  });
});
