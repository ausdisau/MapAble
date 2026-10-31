import test from "node:test";
import assert from "node:assert/strict";

import { TARGETS, commandFor, selectedTargets, run } from "./dev.mjs";

test("only root-owned web and mobile scripts can be launched", () => {
  assert.deepEqual(Object.keys(TARGETS), ["web", "mobile"]);
  assert.deepEqual(selectedTargets("both"), ["web", "mobile"]);
  assert.deepEqual(selectedTargets("web"), ["web"]);
  assert.equal(selectedTargets("; rm -rf /"), null);
  assert.equal(selectedTargets("../../other"), null);
  assert.equal(selectedTargets(undefined), null);
});

test("dry-run demonstrates commands without spawning processes", () => {
  assert.deepEqual(commandFor("web"), ["pnpm dev:web"]);
  assert.deepEqual(commandFor("mobile"), ["npm run dev:mobile"]);
  assert.deepEqual(commandFor("both"), ["pnpm dev:web", "npm run dev:mobile"]);
  assert.equal(run("both", { dryRun: true }), 0);
});

test("refuses any arbitrary target", () => {
  assert.equal(run("../../secrets", { dryRun: true }), 2);
});
