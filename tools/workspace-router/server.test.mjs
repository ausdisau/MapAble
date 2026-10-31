import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_TARGETS, cleanLog, runnerCommand, validatedSearchQuery, workspacePort,
} from "./config.mjs";
import { createWorkspaceRouter } from "./server.mjs";

test("only two fixed app processes are exposed; no user commands", () => {
  assert.deepEqual(Object.keys(APP_TARGETS), ["web", "mobile"]);
  assert.deepEqual(runnerCommand("web", "linux").args, ["dev:web"]);
  assert.deepEqual(runnerCommand("mobile", "linux").args, ["run", "dev:mobile"]);
  assert.deepEqual(runnerCommand("web", "win32").args, ["/d", "/s", "/c", "pnpm dev:web"]);
  assert.throws(() => runnerCommand("rm -rf /"));
});

test("local configuration and public logs fail closed", () => {
  assert.equal(workspacePort(""), 4317);
  assert.equal(workspacePort("4433"), 4433);
  assert.throws(() => workspacePort("0"));
  assert.throws(() => workspacePort("-4"));
  assert.match(cleanLog("DATABASE_URL=postgresql://admin:secret@host/db"), /redacted/);
  assert.doesNotMatch(cleanLog("STRIPE_SECRET_KEY=sk_live_abc123"), /sk_live_abc123/);
  assert.equal(validatedSearchQuery("  Chatswood station  "), "Chatswood station");
  assert.throws(() => validatedSearchQuery(""));
  assert.throws(() => validatedSearchQuery("a"));
  assert.throws(() => validatedSearchQuery("x".repeat(101)));
});

test("serves an honest dashboard with no CORS and a restrictive CSP", async (t) => {
  const router = createWorkspaceRouter({ port: 0 });
  t.after(async () => router.close());
  const origin = await router.listen();
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Local development workspace/);
  assert.doesNotMatch(html, /__MAPABLE_ROUTER_TOKEN__/);
  assert.match(page.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal(page.headers.get("access-control-allow-origin"), null);
  const invalidHost = await fetch(origin + "/api/state", { headers: {
    Host: "untrusted.example",
    "X-Workspace-Token": router.token,
  }});
  assert.equal(invalidHost.status, 403);
});

test("requires local token for data and origin for mutating controls", async (t) => {
  const router = createWorkspaceRouter({ port: 0 });
  t.after(async () => router.close());
  const origin = await router.listen();

  const unauthenticated = await fetch(origin + "/api/state");
  assert.equal(unauthenticated.status, 403);

  const status = await fetch(origin + "/api/state", {
    headers: { "X-Workspace-Token": router.token },
  });
  const current = await status.json();
  assert.equal(status.status, 200);
  assert.equal(current.apps.web.status, "stopped");
  assert.equal(current.apps.mobile.status, "stopped");
  assert.equal(current.webHttpReachable, false);

  const untrustedOrigin = await fetch(origin + "/api/control", {
    method: "POST",
    headers: {
      "X-Workspace-Token": router.token,
      "Content-Type": "application/json",
      Origin: "https://attacker.example",
    },
    body: JSON.stringify({ app: "web", action: "start" }),
  });
  assert.equal(untrustedOrigin.status, 403);

  const badAction = await fetch(origin + "/api/control", {
    method: "POST",
    headers: {
      "X-Workspace-Token": router.token,
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ app: "web", action: "execute-custom-command" }),
  });
  assert.equal(badAction.status, 400);

  const unknownApp = await fetch(origin + "/api/control", {
    method: "POST",
    headers: {
      "X-Workspace-Token": router.token,
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ app: "../bad", action: "start" }),
  });
  assert.equal(unknownApp.status, 400);

  const emptySearch = await fetch(origin + "/api/place-search?q=a", {
    headers: { "X-Workspace-Token": router.token },
  });
  assert.equal(emptySearch.status, 400);
  const unavailableSearch = await fetch(origin + "/api/place-search?q=Sydney", {
    headers: { "X-Workspace-Token": router.token },
  });
  assert.equal(unavailableSearch.status, 503);
});

test("clearing logs requires token, origin and affirmative confirmation", async (t) => {
  const router = createWorkspaceRouter({ port: 0 });
  t.after(async () => router.close());
  const origin = await router.listen();
  const opts = (confirm) => ({
    method: "POST",
    headers: {
      "X-Workspace-Token": router.token,
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ confirm }),
  });
  assert.equal((await fetch(origin + "/api/clear", opts(false))).status, 400);
  assert.equal((await fetch(origin + "/api/clear", opts(true))).status, 200);
  assert.equal(router.getSnapshot().logs.length, 1);
});
