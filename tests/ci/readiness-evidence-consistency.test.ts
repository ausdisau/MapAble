import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

describe("readiness evidence consistency", () => {
  it("passes on the current repository tip", () => {
    const out = execFileSync(
      "pnpm",
      ["exec", "tsx", "scripts/ci/check-readiness-evidence-consistency.ts"],
      { cwd: ROOT, encoding: "utf8" },
    );
    expect(out).toMatch(/passed/i);
  });
});
