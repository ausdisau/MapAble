import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, expect, it } from "vitest";

const mainframeRoot = resolve(process.cwd(), "lib/intelligence/mainframe");

function source(path: string) {
  return readFileSync(resolve(mainframeRoot, path), "utf8");
}

describe("Mainframe Phase A isolation", () => {
  it("contains no database, network, provider SDK, or CareOS service imports", () => {
    const files = [
      "orchestrator/mainframe-orchestrator.ts",
      "missions/care-transport-mission.ts",
      "policy/gateway.ts",
      "model/gateway.ts",
      "registry/tool-registry.ts",
    ];
    for (const file of files) {
      const content = source(file);
      expect(content).not.toMatch(/@prisma\/client|lib\/prisma|from\s+["'].*careos|fetch\(/);
      expect(content).not.toMatch(/openai|generateObject|gateway\(/i);
    }
  });

  it("uses only read-only synthetic tools", () => {
    expect(source("registry/tool-registry.ts")).toContain('risk: "read"');
    expect(source("registry/tool-registry.ts")).toContain("SYNTHETIC_READ_ONLY_REQUIRED");
  });
});
