import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type CoordinatorPageSpec = {
  relativePath: string;
  label: string;
  companionPaths?: string[];
  headingPatterns: RegExp[];
  plainLanguagePatterns: RegExp[];
};

const COORDINATOR_PAGES: CoordinatorPageSpec[] = [
  {
    relativePath: "app/support-coordinator/page.tsx",
    label: "coordinator portal overview",
    headingPatterns: [/<h1[\s>]/, /Support coordinator portal/],
    plainLanguagePatterns: [/consent-based/i, /authorised/i],
  },
  {
    relativePath: "app/support-coordinator/caseload/page.tsx",
    companionPaths: [
      "components/coordinator/CaseloadDashboard.tsx",
      "components/coordinator/TaskBoard.tsx",
      "components/coordinator/EnquiryPanel.tsx",
    ],
    label: "coordinator caseload dashboard",
    headingPatterns: [/<h1[\s>]/, /Caseload dashboard/],
    plainLanguagePatterns: [
      /Operational priority only/i,
      /recorded authority/i,
      /never forces a selection/i,
    ],
  },
];

function readPageSource(relativePath: string): string {
  const absolutePath = join(process.cwd(), relativePath);
  expect(existsSync(absolutePath), `${relativePath} should exist`).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

function readPageWithCompanions(spec: CoordinatorPageSpec): string {
  const sources = [readPageSource(spec.relativePath)];
  for (const companion of spec.companionPaths ?? []) {
    sources.push(readPageSource(companion));
  }
  return sources.join("\n");
}

describe("coordinator page accessibility (source inspection)", () => {
  for (const page of COORDINATOR_PAGES) {
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

      it("includes coordinator-facing plain-language copy", () => {
        const source = readPageWithCompanions(page);
        for (const pattern of page.plainLanguagePatterns) {
          expect(source).toMatch(pattern);
        }
      });
    });
  }
});
