import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type CommunicationPageSpec = {
  relativePath: string;
  companionPaths?: string[];
  label: string;
  headingPatterns: RegExp[];
  plainLanguagePatterns: RegExp[];
};

const COMMUNICATION_PAGES: CommunicationPageSpec[] = [
  {
    relativePath: "app/participant/communication/page.tsx",
    companionPaths: [
      "components/communication/CommunicationPassportPanel.tsx",
      "components/communication/VoiceConfirmationScreen.tsx",
      "components/communication/DegradedModeBanner.tsx",
      "lib/config/mobile-communication.ts",
    ],
    label: "participant communication passport",
    headingPatterns: [/<h1[\s>]/, /Communication passport/],
    plainLanguagePatterns: [
      /Speech difficulty is never treated as reduced capacity/i,
      /bypass is disabled/i,
      /not enabled in this environment/i,
    ],
  },
  {
    relativePath: "app/offline/page.tsx",
    label: "offline fallback page",
    headingPatterns: [/<h1[\s>]/, /offline/i],
    plainLanguagePatterns: [/not cached/i, /reconnect/i],
  },
];

function readPageSource(relativePath: string): string {
  const absolutePath = join(process.cwd(), relativePath);
  expect(existsSync(absolutePath), `${relativePath} should exist`).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

function readPageWithCompanions(spec: CommunicationPageSpec): string {
  const sources = [readPageSource(spec.relativePath)];
  for (const companion of spec.companionPaths ?? []) {
    sources.push(readPageSource(companion));
  }
  return sources.join("\n");
}

describe("mobile communication accessibility (source inspection)", () => {
  for (const page of COMMUNICATION_PAGES) {
    describe(page.label, () => {
      it(`includes ${page.relativePath}`, () => {
        expect(readPageSource(page.relativePath).length).toBeGreaterThan(0);
      });

      it("uses semantic headings", () => {
        const source = readPageSource(page.relativePath);
        for (const pattern of page.headingPatterns) {
          expect(source).toMatch(pattern);
        }
      });

      it("includes plain-language boundary copy", () => {
        const source = readPageWithCompanions(page);
        for (const pattern of page.plainLanguagePatterns) {
          expect(source).toMatch(pattern);
        }
      });

      it("uses accessible labels or live regions", () => {
        const source = readPageWithCompanions(page);
        expect(source).toMatch(/aria-labelledby|role="status"|aria-live|role="dialog"/);
      });
    });
  }
});

describe("voice confirmation accessibility", () => {
  it("uses dialog semantics with minimum touch targets", () => {
    const source = readPageSource("components/communication/VoiceConfirmationScreen.tsx");
    expect(source).toMatch(/role="dialog"/);
    expect(source).toMatch(/aria-modal="true"/);
    expect(source).toMatch(/min-h-11/);
  });
});

describe("offline status accessibility", () => {
  it("uses aria-live for degraded mode banner", () => {
    const source = readPageSource("components/communication/DegradedModeBanner.tsx");
    expect(source).toMatch(/aria-live/);
    expect(source).toMatch(/role="status"/);
  });
});

describe("PWA shell accessibility", () => {
  it("documents excluded participant paths in service worker", () => {
    const source = readPageSource("public/sw.js");
    expect(source).toMatch(/api\/participant/);
    expect(source).not.toMatch(/cache\.put.*participant/i);
  });
});
