/**
 * Pure production-audit evaluation (no live registry calls).
 * Used by check-prod-audit.ts and fixture-driven unit tests.
 */

export type AllowlistException = {
  advisoryId: string;
  package: string;
  path: string;
  rationale: string;
  owner: string;
  compensatingControl: string;
  expiry: string;
};

export type AllowlistFile = {
  exceptions: AllowlistException[];
};

export type AuditAdvisory = {
  id?: string | number;
  github_advisory_id?: string;
  module_name?: string;
  severity?: string;
  findings?: Array<{ paths?: string[] }>;
  url?: string;
};

export type AuditParseResult =
  | { ok: true; advisories: AuditAdvisory[] }
  | { ok: false; error: string };

export type AllowlistParseResult =
  | { ok: true; allowlist: AllowlistFile }
  | { ok: false; error: string };

export type EvaluationResult =
  | {
      ok: true;
      highCount: number;
      activeExceptionCount: number;
    }
  | {
      ok: false;
      error: string;
      unresolved?: string[];
      expired?: string[];
    };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayUtcDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  );
}

export function parseAllowlistJson(raw: string): AllowlistParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Allowlist JSON is malformed" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Allowlist must be a JSON object" };
  }

  const exceptions = (parsed as { exceptions?: unknown }).exceptions;
  if (!Array.isArray(exceptions)) {
    return {
      ok: false,
      error: "advisory-allowlist.json must contain an exceptions array",
    };
  }

  for (const entry of exceptions) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "Allowlist exception must be an object" };
    }
    const e = entry as Partial<AllowlistException>;
    for (const key of [
      "advisoryId",
      "package",
      "path",
      "rationale",
      "owner",
      "compensatingControl",
      "expiry",
    ] as const) {
      if (typeof e[key] !== "string" || !e[key]!.trim()) {
        return {
          ok: false,
          error: `advisory-allowlist exception missing required field: ${key}`,
        };
      }
    }
    if (!isValidIsoDate(e.expiry!)) {
      return {
        ok: false,
        error: `advisory-allowlist exception has malformed expiry: ${e.expiry}`,
      };
    }
  }

  return {
    ok: true,
    allowlist: { exceptions: exceptions as AllowlistException[] },
  };
}

export function parseAuditJson(raw: string): AuditParseResult {
  if (!raw.trim()) {
    return { ok: false, error: "pnpm audit output is empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Unable to parse pnpm audit JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Audit JSON must be an object" };
  }

  const obj = parsed as {
    advisories?: unknown;
    error?: unknown;
    message?: unknown;
  };

  // pnpm/npm sometimes return { error: { ... } } on registry failure
  if (obj.error != null) {
    const msg =
      typeof obj.message === "string"
        ? obj.message
        : typeof obj.error === "string"
          ? obj.error
          : "Audit JSON reports an error field (registry/tool failure)";
    return { ok: false, error: msg };
  }

  if (!("advisories" in obj)) {
    return {
      ok: false,
      error:
        "Audit JSON has unrecognised schema (missing advisories field). Fail closed.",
    };
  }

  if (
    obj.advisories == null ||
    typeof obj.advisories !== "object" ||
    Array.isArray(obj.advisories)
  ) {
    return {
      ok: false,
      error: "Audit JSON advisories field must be an object map",
    };
  }

  return {
    ok: true,
    advisories: Object.values(obj.advisories as Record<string, AuditAdvisory>),
  };
}

export function advisoryIds(adv: AuditAdvisory): string[] {
  const ids: string[] = [];
  if (adv.github_advisory_id) ids.push(String(adv.github_advisory_id));
  if (adv.id != null) ids.push(String(adv.id));
  if (adv.url) {
    const match = adv.url.match(/GHSA-[a-z0-9-]+/i);
    if (match) ids.push(match[0].toUpperCase());
  }
  return [...new Set(ids.map((id) => id.toUpperCase()))];
}

export function evaluateProductionAudit(input: {
  advisories: AuditAdvisory[];
  allowlist: AllowlistFile;
  today?: string;
}): EvaluationResult {
  const today = input.today ?? todayUtcDate();
  const high = input.advisories.filter((a) =>
    ["high", "critical"].includes(String(a.severity ?? "").toLowerCase()),
  );

  const malformedExpiry = input.allowlist.exceptions.filter(
    (e) => !isValidIsoDate(e.expiry),
  );
  if (malformedExpiry.length > 0) {
    return {
      ok: false,
      error: `Malformed allowlist expiry: ${malformedExpiry.map((e) => e.advisoryId).join(", ")}`,
    };
  }

  const expired = input.allowlist.exceptions.filter((e) => e.expiry < today);
  if (expired.length > 0) {
    return {
      ok: false,
      error: "Expired advisory allowlist entries (must renew or remove)",
      expired: expired.map(
        (e) => `${e.advisoryId} (${e.package}) expired ${e.expiry}`,
      ),
    };
  }

  const activeExceptions = input.allowlist.exceptions.filter(
    (e) => e.expiry >= today,
  );

  const unresolved: string[] = [];
  for (const adv of high) {
    const ids = advisoryIds(adv);
    const pkg = adv.module_name ?? "unknown";
    const paths =
      adv.findings?.flatMap((f) => f.paths ?? []) ?? ([] as string[]);
    const matched = activeExceptions.some((ex) => {
      const exId = ex.advisoryId.toUpperCase();
      if (!ids.includes(exId) && !ids.includes(String(adv.id ?? ""))) {
        return false;
      }
      if (ex.package !== pkg) return false;
      if (paths.length === 0) return true;
      return paths.some(
        (p) =>
          p === ex.path || p.startsWith(`${ex.path}>`) || p.includes(ex.path),
      );
    });
    if (!matched) {
      unresolved.push(
        `${adv.severity} ${pkg} ${ids.join("|") || "no-id"} paths=${paths.join(" ; ") || "(none)"}`,
      );
    }
  }

  if (unresolved.length > 0) {
    return {
      ok: false,
      error: `Unresolved high/critical production advisories (${unresolved.length})`,
      unresolved,
    };
  }

  return {
    ok: true,
    highCount: high.length,
    activeExceptionCount: activeExceptions.length,
  };
}
