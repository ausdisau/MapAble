import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const script = join(
  process.cwd(),
  "scripts/ci/validate-human-release-evidence-readonly.mjs",
);

function run(evidencePath?: string): {
  status: number | null;
  stdout: string;
} {
  try {
    const args = evidencePath
      ? [script, "--evidence", evidencePath]
      : [script];
    const stdout = execFileSync(process.execPath, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout };
  } catch (error) {
    const err = error as {
      status?: number | null;
      stdout?: string;
    };
    return { status: err.status ?? 1, stdout: err.stdout ?? "" };
  }
}

describe("validate-human-release-evidence-readonly", () => {
  it("fails closed on malformed JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "human-ev-"));
    const path = join(dir, "bad.json");
    writeFileSync(path, "{ truncated");
    const result = run(path);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("json_parse_error");
  });

  it("fails closed on wrong-schema root", () => {
    const dir = mkdtempSync(join(tmpdir(), "human-ev-"));
    const path = join(dir, "array.json");
    writeFileSync(path, "[]");
    const result = run(path);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("wrong_schema_root");
  });

  it("fails closed on oversized evidence", () => {
    const dir = mkdtempSync(join(tmpdir(), "human-ev-"));
    const path = join(dir, "huge.json");
    writeFileSync(path, `{"pad":"${"x".repeat(300_000)}"}`);
    const result = run(path);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("evidence_too_large");
  });

  it("returns OWNER_ACTION_REQUIRED for incomplete valid JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "human-ev-"));
    const path = join(dir, "incomplete.json");
    writeFileSync(
      path,
      JSON.stringify({
        tester: "t",
        date: "2026-07-22",
        commitSha: "abc",
        url: "https://example.com",
        overallStatus: "NOT_RUN",
      }),
    );
    const result = run(path);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("OWNER_ACTION_REQUIRED");
    expect(result.stdout).toContain("journeys");
  });
});
