#!/usr/bin/env node
/**
 * Flag-on CSP preview smoke (read-only HTTP checks).
 *
 * Usage:
 *   BASE_URL=https://<preview-host> node scripts/preview/csp-enforce-preview-smoke.mjs
 *
 * Does not mutate production. Does not claim PASS without human review of
 * console violations — header presence alone is insufficient for maps/auth/payments.
 */
const base = (process.env.BASE_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("BASE_URL is required");
  process.exit(2);
}

const routes = [
  "/",
  "/login",
  "/provider-finder",
  "/accessibility-map",
];

const results = [];

for (const route of routes) {
  const url = `${base}${route}`;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { Accept: "text/html" },
    });
    const csp = res.headers.get("content-security-policy");
    const reportOnly = res.headers.get("content-security-policy-report-only");
    results.push({
      route,
      status: res.status,
      enforce: Boolean(csp),
      reportOnly: Boolean(reportOnly),
      hasNonce: Boolean(csp && csp.includes("nonce-")),
      hasUnsafeEval: Boolean(csp && csp.includes("unsafe-eval")),
    });
  } catch (error) {
    results.push({
      route,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify({ base, results }, null, 2));

const enforceMissing = results.filter((r) => r.enforce === false);
if (enforceMissing.length) {
  console.error(
    "\nNOTE: Enforce header missing on some routes. Confirm MAPABLE_CSP_ENFORCE_PREVIEW=true on this preview (not production).",
  );
  process.exit(1);
}

console.error(
  "\nHeader checks passed. Record console/route usability in csp-enforce-preview-smoke.md (still NOT_RUN until human).",
);
