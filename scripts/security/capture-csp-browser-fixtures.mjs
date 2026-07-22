/**
 * Capture sanitised CSP report fixtures from Playwright browsers.
 *
 * Prefer intercepting the browser's report-uri POST. If the environment does
 * not deliver report-uri (common in some headless setups), fall back to the
 * browser's SecurityPolicyViolationEvent field values mapped into the
 * standard legacy / Reporting API JSON shapes — still browser-authored values.
 *
 * Usage:
 *   node scripts/security/capture-csp-browser-fixtures.mjs
 */
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../../tests/security/fixtures/csp-browser");

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CSP fixture capture</title>
</head>
<body>
  <h1>CSP fixture capture</h1>
  <p id="status">waiting</p>
  <script>
    window.__cspEvents = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspEvents.push({
        documentURI: event.documentURI,
        referrer: event.referrer,
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        disposition: event.disposition,
        sourceFile: event.sourceFile,
        statusCode: event.statusCode,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        sample: event.sample,
      });
      document.getElementById("status").textContent = "violated";
    });
  </script>
  <script src="https://fixture-blocked.example/csp-probe.js"></script>
</body>
</html>`;

function sanitiseDeep(value) {
  const raw = JSON.stringify(value);
  const cleaned = raw
    .replace(/https?:\/\/127\.0\.0\.1:\d+/g, "https://fixture.local")
    .replace(/https?:\/\/localhost:\d+/g, "https://fixture.local")
    .replace(/https?:\/\/\[::1\]:\d+/g, "https://fixture.local");
  return JSON.parse(cleaned);
}

function eventToLegacy(event) {
  return {
    "csp-report": {
      "document-uri": event.documentURI || null,
      referrer: event.referrer || "",
      "blocked-uri": event.blockedURI || null,
      "violated-directive": event.violatedDirective || null,
      "effective-directive": event.effectiveDirective || null,
      "original-policy": event.originalPolicy || null,
      disposition: event.disposition || "report",
      "source-file": event.sourceFile || null,
      "status-code": event.statusCode ?? 0,
      "line-number": event.lineNumber ?? 0,
      "column-number": event.columnNumber ?? 0,
      "script-sample": event.sample || "",
    },
  };
}

function eventToReportingApi(event) {
  return [
    {
      age: 0,
      type: "csp-violation",
      url: event.documentURI || "https://fixture.local/",
      user_agent: "synthetic-browser",
      body: {
        documentURL: event.documentURI || null,
        referrer: event.referrer || "",
        blockedURL: event.blockedURI || null,
        effectiveDirective: event.effectiveDirective || null,
        violatedDirective: event.violatedDirective || null,
        originalPolicy: event.originalPolicy || null,
        disposition: event.disposition || "report",
        sourceFile: event.sourceFile || null,
        statusCode: event.statusCode ?? 0,
        lineNumber: event.lineNumber ?? 0,
        columnNumber: event.columnNumber ?? 0,
        sample: event.sample || "",
      },
    },
  ];
}

async function withServer(handler) {
  const posts = [];
  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url?.startsWith("/csp-report")) {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        posts.push({
          contentType: req.headers["content-type"] || "",
          body: Buffer.concat(chunks).toString("utf8"),
        });
        res.statusCode = 204;
        res.end();
      });
      return;
    }
    res.setHeader(
      "Content-Security-Policy-Report-Only",
      "default-src 'self'; script-src 'self'; report-uri /csp-report",
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(HTML);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await handler(server, port, posts);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function captureWith(browserType, name) {
  return withServer(async (_server, port, posts) => {
    const browser = await browserType.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      const reportRequest = page
        .waitForRequest(
          (req) => req.method() === "POST" && req.url().includes("/csp-report"),
          { timeout: 8_000 },
        )
        .catch(() => null);

      await page.goto(`http://127.0.0.1:${port}/`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(1500);
      const req = await reportRequest;

      if (req) {
        const bodyText = req.postData() || posts[0]?.body || "";
        const contentType =
          req.headers()["content-type"] ||
          posts[0]?.contentType ||
          "application/csp-report";
        const parsed = JSON.parse(bodyText);
        return {
          engine: name,
          contentType: contentType.split(";")[0].trim(),
          captureMethod: "report-uri-post",
          report: sanitiseDeep(parsed),
        };
      }

      const events = await page.evaluate(() => window.__cspEvents || []);
      if (!events.length) {
        throw new Error(`${name}: no report-uri POST and no violation events`);
      }
      const event = events[0];
      // Chromium-family often uses Reporting API field names; Firefox/WebKit legacy.
      const preferReporting = name === "chromium";
      return {
        engine: name,
        contentType: preferReporting
          ? "application/reports+json"
          : "application/csp-report",
        captureMethod: "securitypolicyviolation-event",
        report: sanitiseDeep(
          preferReporting ? eventToReportingApi(event) : eventToLegacy(event),
        ),
      };
    } finally {
      await browser.close();
    }
  });
}

const engines = [
  { name: "chromium", type: chromium },
  { name: "firefox", type: firefox },
  { name: "webkit", type: webkit },
];

mkdirSync(OUT_DIR, { recursive: true });
const results = [];

for (const engine of engines) {
  try {
    const captured = await captureWith(engine.type, engine.name);
    const file = captured.contentType.includes("reports")
      ? `${engine.name}-reporting-api.json`
      : `${engine.name}-legacy.json`;
    writeFileSync(
      join(OUT_DIR, file),
      `${JSON.stringify(captured.report, null, 2)}\n`,
    );
    results.push({
      engine: engine.name,
      status: "captured",
      file,
      contentType: captured.contentType,
      captureMethod: captured.captureMethod,
    });
    console.log(JSON.stringify({ ok: true, ...results.at(-1) }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ engine: engine.name, status: "NOT_RUN", reason: message });
    console.log(
      JSON.stringify({ ok: false, engine: engine.name, reason: message }),
    );
  }
}

writeFileSync(
  join(OUT_DIR, "capture-manifest.json"),
  `${JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      method:
        "Playwright headless page with Content-Security-Policy-Report-Only; blocked external script; report-uri intercept preferred; SecurityPolicyViolationEvent fallback; hosts sanitised to https://fixture.local",
      results,
    },
    null,
    2,
  )}\n`,
);

process.exit(results.some((r) => r.status === "captured") ? 0 : 1);
