import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type AuthorityPageSpec = {
  relativePath: string;
  label: string;
  /** Companion components that host revoke controls referenced by the page. */
  companionPaths?: string[];
  headingPatterns: RegExp[];
  revokeControlPatterns: RegExp[];
  plainLanguagePatterns: RegExp[];
};

const AUTHORITY_PAGES: AuthorityPageSpec[] = [
  {
    relativePath: "app/participant/privacy/page.tsx",
    companionPaths: ["components/authority/PeopleWithAccess.tsx"],
    label: "participant privacy and access",
    headingPatterns: [/<h1[\s>]/, /People with access/, /Consent timeline/],
    revokeControlPatterns: [/You can revoke access/i, /Revoke access/],
    plainLanguagePatterns: [
      /act on your behalf/i,
      /You can revoke access[\s\S]*at any time/i,
    ],
  },
  {
    relativePath: "app/participant/delegates/page.tsx",
    companionPaths: ["components/authority/DelegateControls.tsx"],
    label: "participant delegates",
    headingPatterns: [/<h1[\s>]/, /Delegates/],
    revokeControlPatterns: [/Revoke/],
    plainLanguagePatterns: [
      /Invite trusted people/i,
      /cannot[\s\S]*be delegated through a simple invitation/i,
      /Financial and[\s\S]*clinical access/i,
    ],
  },
  {
    relativePath: "app/account/security/page.tsx",
    companionPaths: ["components/privacy/SessionDeviceLists.tsx"],
    label: "account security",
    headingPatterns: [
      /<h1[\s>]/,
      /Account security/,
      /Multi-factor authentication/,
    ],
    revokeControlPatterns: [/revoke access at any time/i],
    plainLanguagePatterns: [/sign in/i, /passkey/i, /You stay in control/i],
  },
];

function readPageSource(relativePath: string): string {
  const absolutePath = join(process.cwd(), relativePath);
  expect(existsSync(absolutePath), `${relativePath} should exist`).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

function readPageWithCompanions(spec: AuthorityPageSpec): string {
  const sources = [readPageSource(spec.relativePath)];
  for (const companion of spec.companionPaths ?? []) {
    sources.push(readPageSource(companion));
  }
  return sources.join("\n");
}

describe("authority page accessibility (source inspection)", () => {
  for (const page of AUTHORITY_PAGES) {
    describe(page.label, () => {
      it(`includes ${page.relativePath}`, () => {
        const source = readPageSource(page.relativePath);
        expect(source.length).toBeGreaterThan(0);
      });

      it("uses semantic headings", () => {
        const source = readPageSource(page.relativePath);
        for (const pattern of page.headingPatterns) {
          expect(source).toMatch(pattern);
        }
      });

      it("labels revoke or session-removal controls in plain language", () => {
        const source = readPageWithCompanions(page);
        const matched = page.revokeControlPatterns.some((pattern) =>
          pattern.test(source),
        );
        expect(matched).toBe(true);
      });

      it("includes participant-facing plain-language copy", () => {
        const source = readPageSource(page.relativePath);
        for (const pattern of page.plainLanguagePatterns) {
          expect(source).toMatch(pattern);
        }
      });
    });
  }
});
