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

function writeEvidence(obj: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "human-ev-"));
  const path = join(dir, "evidence.json");
  writeFileSync(path, typeof obj === "string" ? obj : JSON.stringify(obj));
  return path;
}

const passingBase = {
  tester: "Ada Tester",
  date: "2026-07-22",
  commitSha: "8e722ec5a25feda594b084a46ec3a50a8d69c697",
  url: "https://mapable.com.au",
  journeys: [
    { id: "keyboard", status: "VERIFIED", evidenceRef: "artifact://keyboard" },
  ],
};

describe("validate-human-release-evidence-readonly", () => {
  it("accepts valid VERIFIED with exit 0", () => {
    const result = run(
      writeEvidence({ ...passingBase, overallStatus: "VERIFIED" }),
    );
    expect(result.status).toBe(0);
    const body = JSON.parse(result.stdout);
    expect(body.overall).toBe("VERIFIED");
    expect(body.sourceStatus).toBe("VERIFIED");
  });

  it("accepts valid PASS with exit 0", () => {
    const result = run(
      writeEvidence({
        ...passingBase,
        overallStatus: "PASS",
        journeys: [
          { id: "keyboard", status: "PASS", evidenceRef: "artifact://keyboard" },
        ],
      }),
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).overall).toBe("PASS");
  });

  for (const status of ["FAILED", "FAIL"] as const) {
    it(`preserves ${status} and exits non-zero (never VERIFIED)`, () => {
      const result = run(
        writeEvidence({
          ...passingBase,
          overallStatus: status,
          journeys: [{ id: "keyboard", status, evidenceRef: "n/a" }],
        }),
      );
      expect(result.status).toBe(1);
      const body = JSON.parse(result.stdout);
      expect(body.overall).toBe(status);
      expect(body.overall).not.toBe("VERIFIED");
    });
  }

  for (const status of ["BLOCKED", "STOP", "OWNER_ACTION_REQUIRED"] as const) {
    it(`preserves ${status} and exits non-zero`, () => {
      const result = run(
        writeEvidence({
          ...passingBase,
          overallStatus: status,
          journeys: [{ id: "keyboard", status, evidenceRef: "n/a" }],
        }),
      );
      expect(result.status).toBe(2);
      expect(JSON.parse(result.stdout).overall).toBe(status);
    });
  }

  for (const status of ["NOT_RUN", "INCOMPLETE"] as const) {
    it(`preserves ${status} and exits non-zero`, () => {
      const result = run(
        writeEvidence({
          ...passingBase,
          overallStatus: status,
          journeys: [{ id: "keyboard", status, evidenceRef: "pending" }],
        }),
      );
      expect(result.status).toBe(2);
      expect(JSON.parse(result.stdout).overall).toBe(status);
    });
  }

  it("fails closed on missing file", () => {
    const result = run(join(tmpdir(), "missing-human-evidence.json"));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("file_missing");
  });

  it("fails closed on empty file", () => {
    const path = writeEvidence("");
    writeFileSync(path, "");
    const result = run(path);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("empty_file");
  });

  it("fails closed on malformed and truncated JSON", () => {
    const result = run(writeEvidence("{ truncated"));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("json_parse_error");
  });

  it("fails closed on wrong schema root", () => {
    const result = run(writeEvidence("[]"));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("wrong_schema_root");
  });

  it("rejects unknown status", () => {
    const result = run(
      writeEvidence({ ...passingBase, overallStatus: "MAYBE" }),
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("unknown_status");
  });

  it("rejects contradictory overall VERIFIED with failed journey", () => {
    const result = run(
      writeEvidence({
        ...passingBase,
        overallStatus: "VERIFIED",
        journeys: [
          { id: "keyboard", status: "FAILED", evidenceRef: "artifact://x" },
        ],
      }),
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("contradictory_status");
  });

  it("fails closed on oversized evidence", () => {
    const result = run(writeEvidence(`{"pad":"${"x".repeat(300_000)}"}`));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("evidence_too_large");
  });

  it("exits non-zero when one of multiple checks does not pass", () => {
    const result = run(
      writeEvidence({
        ...passingBase,
        overallStatus: "VERIFIED",
        journeys: [
          {
            id: "keyboard",
            status: "VERIFIED",
            evidenceRef: "artifact://keyboard",
          },
          { id: "nvda", status: "NOT_RUN", evidenceRef: "pending" },
        ],
      }),
    );
    expect(result.status).not.toBe(0);
    expect(JSON.parse(result.stdout).overall).not.toBe("VERIFIED");
  });

  it("exits non-zero for incomplete schema (never exit 0)", () => {
    const result = run(
      writeEvidence({
        tester: "t",
        date: "2026-07-22",
        commitSha: "abc",
        url: "https://example.com",
        overallStatus: "NOT_RUN",
      }),
    );
    expect(result.status).toBe(2);
    const body = JSON.parse(result.stdout);
    expect(["NOT_RUN", "OWNER_ACTION_REQUIRED"]).toContain(body.overall);
    expect(body.overall).not.toBe("VERIFIED");
    expect(result.stdout).toContain("journeys");
  });

  it("missing --evidence exits non-zero", () => {
    const result = run();
    expect(result.status).toBe(2);
    expect(result.stdout).toContain("missing --evidence");
  });
});
