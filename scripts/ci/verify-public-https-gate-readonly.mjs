#!/usr/bin/env node
/**
 * Read-only public HTTPS / canonical gate checks for account-owner evidence.
 *
 * - Never prints secrets, cookies, or Authorization headers.
 * - Never mutates Vercel, Neon, DNS, or GitHub.
 * - Does not read private Vercel env; owner must confirm NEXTAUTH_URL /
 *   NEXT_PUBLIC_APP_URL in the Vercel Production UI separately.
 *
 * Usage:
 *   node scripts/ci/verify-public-https-gate-readonly.mjs
 *   node scripts/ci/verify-public-https-gate-readonly.mjs --base https://mapable.com.au
 */
const DEFAULT_BASE = "https://mapable.com.au";

function parseArgs(argv) {
  const idx = argv.indexOf("--base");
  return {
    base: idx >= 0 ? argv[idx + 1] : DEFAULT_BASE,
  };
}

function redactUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.username || u.password) {
      u.username = "REDACTED";
      u.password = "REDACTED";
    }
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return "[invalid-url]";
  }
}

function validateBase(base) {
  const issues = [];
  let url;
  try {
    url = new URL(base);
  } catch {
    return { ok: false, issues: ["BASE_URL is not a valid absolute URL"] };
  }
  if (url.protocol !== "https:") {
    issues.push("BASE_URL must use https:");
  }
  if (url.username || url.password) {
    issues.push("BASE_URL must not embed credentials");
  }
  if (/localhost|127\.0\.0\.1/i.test(url.hostname)) {
    issues.push("BASE_URL must not be localhost");
  }
  if (url.hostname !== "mapable.com.au" && base === DEFAULT_BASE) {
    issues.push("Expected canonical apex mapable.com.au");
  }
  return { ok: issues.length === 0, issues, url };
}

async function fetchProbe(base, path) {
  const target = new URL(path, base).toString();
  const started = Date.now();
  try {
    const res = await fetch(target, {
      method: "GET",
      redirect: "manual",
      headers: { Accept: "application/json, text/html;q=0.9,*/*;q=0.8" },
    });
    return {
      path,
      url: redactUrl(target),
      status: res.status,
      location: res.headers.get("location")
        ? redactUrl(res.headers.get("location"))
        : null,
      cacheControl: res.headers.get("cache-control"),
      contentType: res.headers.get("content-type"),
      ms: Date.now() - started,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (error) {
    return {
      path,
      url: redactUrl(target),
      status: null,
      error: error instanceof Error ? error.name : "fetch_failed",
      ms: Date.now() - started,
      ok: false,
    };
  }
}

async function main() {
  const { base } = parseArgs(process.argv.slice(2));
  const baseCheck = validateBase(base);

  const report = {
    mode: "read_only",
    mutatesExternalState: false,
    secretsPrinted: false,
    base: redactUrl(base),
    baseValidation: baseCheck.issues,
    ownerMustConfirmInVercelProduction: [
      "NEXTAUTH_URL=https://mapable.com.au",
      "NEXT_PUBLIC_APP_URL=https://mapable.com.au",
      "Values match each other",
      "No localhost / http",
      "No embedded credentials",
      "Redeploy Production after change",
      "Record deployment ID + commit SHA + build result",
    ],
    probes: [],
    overall: "NOT_RUN",
  };

  if (!baseCheck.ok) {
    report.overall = "FAILED";
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const paths = [
    "/",
    "/api/health/live",
    "/api/health/ready",
    "/api/auth/session",
    "/api/auth/providers",
  ];

  for (const path of paths) {
    report.probes.push(await fetchProbe(base, path));
  }

  const probeFail = report.probes.some((p) => !p.ok);
  report.overall = probeFail ? "FAILED" : "VERIFIED_PUBLIC_EDGE_ONLY";
  report.note =
    "Public edge probes do not prove Vercel Production env vars. Leave NEXTAUTH_URL / NEXT_PUBLIC_APP_URL as OWNER_ACTION_REQUIRED until owner records UI evidence after redeploy.";

  console.log(JSON.stringify(report, null, 2));
  process.exit(probeFail ? 1 : 0);
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      overall: "FAILED",
      error: error instanceof Error ? error.name : "unknown",
      secretsPrinted: false,
    }),
  );
  process.exit(1);
});
