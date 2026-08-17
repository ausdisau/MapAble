import { describe, expect, it } from "vitest";

import {
  evaluateProductionAudit,
  parseAllowlistJson,
  parseAuditJson,
} from "../../scripts/ci/prod-audit-lib";

const emptyAllowlist = JSON.stringify({ exceptions: [] });

describe("prod-audit-lib", () => {
  it("accepts zero advisories", () => {
    const audit = parseAuditJson(JSON.stringify({ advisories: {} }));
    expect(audit.ok).toBe(true);
    const allowlist = parseAllowlistJson(emptyAllowlist);
    expect(allowlist.ok).toBe(true);
    if (!audit.ok || !allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: audit.advisories,
      allowlist: allowlist.allowlist,
    });
    expect(result).toEqual({
      ok: true,
      highCount: 0,
      activeExceptionCount: 0,
    });
  });

  it("fails on unresolved high advisory", () => {
    const audit = parseAuditJson(
      JSON.stringify({
        advisories: {
          "1": {
            id: 1,
            github_advisory_id: "GHSA-TEST-UNRESOLVED",
            module_name: "left-pad",
            severity: "high",
            findings: [{ paths: [".>left-pad"] }],
          },
        },
      }),
    );
    expect(audit.ok).toBe(true);
    if (!audit.ok) return;
    const allowlist = parseAllowlistJson(emptyAllowlist);
    if (!allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: audit.advisories,
      allowlist: allowlist.allowlist,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unresolved?.[0]).toMatch(/left-pad/);
  });

  it("allows unexpired allowlisted advisory", () => {
    const audit = parseAuditJson(
      JSON.stringify({
        advisories: {
          "1": {
            id: 1,
            github_advisory_id: "GHSA-TEST-ALLOWED",
            module_name: "left-pad",
            severity: "high",
            findings: [{ paths: [".>left-pad"] }],
          },
        },
      }),
    );
    const allowlist = parseAllowlistJson(
      JSON.stringify({
        exceptions: [
          {
            advisoryId: "GHSA-TEST-ALLOWED",
            package: "left-pad",
            path: ".>left-pad",
            rationale: "test fixture",
            owner: "@ausdisau",
            compensatingControl: "fixture only",
            expiry: "2099-01-01",
          },
        ],
      }),
    );
    expect(audit.ok && allowlist.ok).toBe(true);
    if (!audit.ok || !allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: audit.advisories,
      allowlist: allowlist.allowlist,
      today: "2026-07-19",
    });
    expect(result.ok).toBe(true);
  });

  it("fails on expired exception", () => {
    const allowlist = parseAllowlistJson(
      JSON.stringify({
        exceptions: [
          {
            advisoryId: "GHSA-TEST-EXPIRED",
            package: "left-pad",
            path: ".>left-pad",
            rationale: "test fixture",
            owner: "@ausdisau",
            compensatingControl: "fixture only",
            expiry: "2020-01-01",
          },
        ],
      }),
    );
    expect(allowlist.ok).toBe(true);
    if (!allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: [],
      allowlist: allowlist.allowlist,
      today: "2026-07-19",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.expired?.[0]).toMatch(/GHSA-TEST-EXPIRED/);
  });

  it("fails on malformed expiry", () => {
    const allowlist = parseAllowlistJson(
      JSON.stringify({
        exceptions: [
          {
            advisoryId: "GHSA-TEST-BAD-DATE",
            package: "left-pad",
            path: ".>left-pad",
            rationale: "test fixture",
            owner: "@ausdisau",
            compensatingControl: "fixture only",
            expiry: "not-a-date",
          },
        ],
      }),
    );
    expect(allowlist.ok).toBe(false);
    if (allowlist.ok) return;
    expect(allowlist.error).toMatch(/malformed expiry/i);
  });

  it("fails on malformed JSON", () => {
    expect(parseAuditJson("{not-json").ok).toBe(false);
    expect(parseAllowlistJson("{not-json").ok).toBe(false);
  });

  it("fails on valid JSON error response", () => {
    const parsed = parseAuditJson(
      JSON.stringify({ error: { code: "EUSAGE" }, message: "registry down" }),
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/registry down|error/i);
  });

  it("fails on empty output (command/registry failure path)", () => {
    const parsed = parseAuditJson("");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/empty/i);
  });

  it("fails on unrecognised schema without advisories", () => {
    const parsed = parseAuditJson(JSON.stringify({ metadata: {} }));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toMatch(/unrecognised schema/i);
  });

  it("rejects substring path allowlist matches for unrelated dependencies", () => {
    const audit = parseAuditJson(
      JSON.stringify({
        advisories: {
          "1": {
            id: 1,
            github_advisory_id: "GHSA-TEST-PATH",
            module_name: "left-pad",
            severity: "critical",
            findings: [
              {
                paths: [
                  ".>unrelated-wrapper>left-pad-extra>deep",
                  ".>other>left-pad-helper",
                ],
              },
            ],
          },
        },
      }),
    );
    const allowlist = parseAllowlistJson(
      JSON.stringify({
        exceptions: [
          {
            advisoryId: "GHSA-TEST-PATH",
            package: "left-pad",
            // Substring of finding paths, but not exact or formal descendant prefix.
            path: "left-pad",
            rationale: "adversarial fixture",
            owner: "@ausdisau",
            compensatingControl: "fixture only",
            expiry: "2099-01-01",
          },
        ],
      }),
    );
    expect(audit.ok && allowlist.ok).toBe(true);
    if (!audit.ok || !allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: audit.advisories,
      allowlist: allowlist.allowlist,
      today: "2026-07-19",
    });
    expect(result.ok).toBe(false);
  });

  it("allows exact path and formal descendant path only", () => {
    const audit = parseAuditJson(
      JSON.stringify({
        advisories: {
          "1": {
            id: 1,
            github_advisory_id: "GHSA-TEST-DESCENDANT",
            module_name: "left-pad",
            severity: "high",
            findings: [{ paths: [".>app>left-pad>nested"] }],
          },
        },
      }),
    );
    const allowlist = parseAllowlistJson(
      JSON.stringify({
        exceptions: [
          {
            advisoryId: "GHSA-TEST-DESCENDANT",
            package: "left-pad",
            path: ".>app>left-pad",
            rationale: "fixture",
            owner: "@ausdisau",
            compensatingControl: "fixture",
            expiry: "2099-01-01",
          },
        ],
      }),
    );
    expect(audit.ok && allowlist.ok).toBe(true);
    if (!audit.ok || !allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: audit.advisories,
      allowlist: allowlist.allowlist,
      today: "2026-07-19",
    });
    expect(result.ok).toBe(true);
  });

  it("fails closed when advisory has no finding paths", () => {
    const audit = parseAuditJson(
      JSON.stringify({
        advisories: {
          "1": {
            id: 1,
            github_advisory_id: "GHSA-TEST-NOPATH",
            module_name: "left-pad",
            severity: "high",
            findings: [{}],
          },
        },
      }),
    );
    const allowlist = parseAllowlistJson(
      JSON.stringify({
        exceptions: [
          {
            advisoryId: "GHSA-TEST-NOPATH",
            package: "left-pad",
            path: ".>left-pad",
            rationale: "fixture",
            owner: "@ausdisau",
            compensatingControl: "fixture",
            expiry: "2099-01-01",
          },
        ],
      }),
    );
    expect(audit.ok && allowlist.ok).toBe(true);
    if (!audit.ok || !allowlist.ok) return;
    const result = evaluateProductionAudit({
      advisories: audit.advisories,
      allowlist: allowlist.allowlist,
      today: "2026-07-19",
    });
    expect(result.ok).toBe(false);
  });
});
