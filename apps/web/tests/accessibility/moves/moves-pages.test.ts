import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type MovesPageSpec = {
  relativePath: string;
  label: string;
  companionPaths?: string[];
  headingPatterns: RegExp[];
  plainLanguagePatterns: RegExp[];
};

const MOVES_PAGES: MovesPageSpec[] = [
  {
    relativePath: "app/participant/moves/page.tsx",
    companionPaths: [
      "components/moves/GoalsPanel.tsx",
      "components/moves/TodayActivitiesPanel.tsx",
      "components/moves/PlanPausePanel.tsx",
      "lib/moves/clinical-boundaries.ts",
    ],
    label: "participant moves rehabilitation",
    headingPatterns: [/<h1[\s>]/, /My rehabilitation/],
    plainLanguagePatterns: [
      /does not diagnose/i,
      /not proof of clinical improvement/i,
      /pause/i,
    ],
  },
  {
    relativePath: "app/clinician/moves/page.tsx",
    companionPaths: [
      "components/moves/ClinicianQueuePanels.tsx",
      "lib/moves/clinical-boundaries.ts",
    ],
    label: "clinician moves plan editor",
    headingPatterns: [/<h1[\s>]/, /Rehabilitation plans/],
    plainLanguagePatterns: [
      /clinical authors/i,
      /does not diagnose/i,
      /not proof of clinical improvement/i,
      /Review queue/i,
    ],
  },
];

function readPageSource(relativePath: string): string {
  const absolutePath = join(process.cwd(), relativePath);
  expect(existsSync(absolutePath), `${relativePath} should exist`).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

function readPageWithCompanions(spec: MovesPageSpec): string {
  const sources = [readPageSource(spec.relativePath)];
  for (const companion of spec.companionPaths ?? []) {
    sources.push(readPageSource(companion));
  }
  return sources.join("\n");
}

describe("moves page accessibility (source inspection)", () => {
  for (const page of MOVES_PAGES) {
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

      it("includes plain-language clinical boundary copy", () => {
        const source = readPageWithCompanions(page);
        for (const pattern of page.plainLanguagePatterns) {
          expect(source).toMatch(pattern);
        }
      });

      it("uses accessible section labels", () => {
        const source = readPageWithCompanions(page);
        expect(source).toMatch(/aria-labelledby|role="status"/);
      });
    });
  }
});
