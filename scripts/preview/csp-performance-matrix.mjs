#!/usr/bin/env node
/**
 * Comparative CSP performance matrix (synthetic local/CI).
 *
 * Usage:
 *   FLAG_OFF_BASE=http://127.0.0.1:3000 FLAG_ON_BASE=http://127.0.0.1:3001 \
 *     node scripts/preview/csp-performance-matrix.mjs
 *
 * Does not claim real-user performance. Budgets are advisory regression guards.
 */
const routes = ["/", "/login", "/provider-finder", "/accessibility-map"];
const flagOffBase = (process.env.FLAG_OFF_BASE || "").replace(/\/$/, "");
const flagOnBase = (process.env.FLAG_ON_BASE || "").replace(/\/$/, "");

/** Advisory budgets (ms) — synthetic only */
const BUDGETS = {
  ttfbMs: 3000,
  loadMs: 12000,
};

if (!flagOffBase || !flagOnBase) {
  console.error("FLAG_OFF_BASE and FLAG_ON_BASE are required");
  process.exit(2);
}

async function measure(base, route) {
  const url = `${base}${route}`;
  const started = performance.now();
  const res = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "text/html" },
  });
  const ttfb = performance.now() - started;
  const buf = await res.arrayBuffer();
  const load = performance.now() - started;
  return {
    route,
    status: res.status,
    ttfbMs: Math.round(ttfb),
    loadMs: Math.round(load),
    bytes: buf.byteLength,
    cacheControl: res.headers.get("cache-control"),
    enforce: Boolean(res.headers.get("content-security-policy")),
    reportOnly: Boolean(
      res.headers.get("content-security-policy-report-only"),
    ),
    dynamicHint:
      res.headers.get("x-nextjs-cache") ||
      res.headers.get("x-vercel-cache") ||
      null,
  };
}

const rows = [];
for (const route of routes) {
  const off = await measure(flagOffBase, route);
  const on = await measure(flagOnBase, route);
  rows.push({
    route,
    flagOff: off,
    flagOn: on,
    deltas: {
      ttfbMs: on.ttfbMs - off.ttfbMs,
      loadMs: on.loadMs - off.loadMs,
      bytes: on.bytes - off.bytes,
    },
    budgetOk:
      on.ttfbMs <= BUDGETS.ttfbMs &&
      on.loadMs <= BUDGETS.loadMs &&
      off.ttfbMs <= BUDGETS.ttfbMs &&
      off.loadMs <= BUDGETS.loadMs,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  note: "Synthetic CI/local only — NOT real-user Web Vitals. Vercel Preview flag-on remains NOT_RUN.",
  budgets: BUDGETS,
  rows,
};

console.log(JSON.stringify(report, null, 2));
const failed = rows.filter((r) => !r.budgetOk);
process.exit(failed.length ? 1 : 0);
