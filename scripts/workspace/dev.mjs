#!/usr/bin/env node
/**
 * LOCAL-ONLY MapAble web/mobile process runner.
 * No HTTP server, shell command input, arbitrary paths, or privileged endpoint.
 * Uses fixed commands from the canonical repository's root package.json.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import readline from "node:readline";

export const TARGETS = Object.freeze({
  web: Object.freeze({ executable: "pnpm", args: Object.freeze(["dev:web"]) }),
  mobile: Object.freeze({ executable: "npm", args: Object.freeze(["run", "dev:mobile"]) }),
});

export function selectedTargets(target) {
  if (target === "both") return ["web", "mobile"];
  if (Object.hasOwn(TARGETS, target)) return [target];
  return null;
}

export function commandFor(target) {
  const selected = selectedTargets(target);
  if (!selected) return null;
  return selected.map((id) => [TARGETS[id].executable, ...TARGETS[id].args].join(" "));
}

function help() {
  process.stdout.write([
    "MapAble Unified local workspace runner",
    "Usage: node scripts/workspace/dev.mjs <web|mobile|both> [--dry-run]",
    "Processes run locally. Stop with Ctrl+C. No remote control endpoint exists.",
    "",
  ].join("\n"));
}

export function run(target, { dryRun = false } = {}) {
  const selected = selectedTargets(target);
  if (!selected) {
    help();
    return 2;
  }
  if (dryRun) {
    commandFor(target).forEach((command) => process.stdout.write(`${command}\n`));
    return 0;
  }

  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const children = new Map();
  let shutdown = false;
  let nonzero = false;
  let remaining = selected.length;

  function stopAll(signal = "SIGTERM") {
    if (shutdown) return;
    shutdown = true;
    for (const child of children.values()) {
      if (!child.pid || child.exitCode !== null) continue;
      try {
        if (process.platform === "win32") {
          // Only the child tree started by this runner is terminated.
          spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        } else {
          process.kill(-child.pid, signal);
        }
      } catch (error) {
        process.stderr.write(`Could not stop process ${child.pid}: ${String(error)}\n`);
      }
    }
  }

  process.on("SIGINT", () => stopAll("SIGINT"));
  process.on("SIGTERM", () => stopAll("SIGTERM"));

  for (const id of selected) {
    const settings = TARGETS[id];
    const executable = process.platform === "win32" ? `${settings.executable}.cmd` : settings.executable;
    const child = spawn(executable, [...settings.args], {
      cwd: repoRoot,
      stdio: ["inherit", "pipe", "pipe"],
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      windowsHide: true,
    });
    children.set(id, child);
    process.stdout.write(`[${id}] Starting ${settings.executable} ${settings.args.join(" ")}\n`);
    for (const [stream, output] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      if (!stream) continue;
      readline.createInterface({ input: stream }).on("line", (line) => {
        output.write(`[${id}] ${line}\n`);
      });
    }
    child.once("error", (error) => {
      nonzero = true;
      process.stderr.write(`[${id}] Could not launch: ${String(error)}\n`);
      stopAll();
    });
    child.once("close", (code) => {
      remaining--;
      if (code !== 0 && !shutdown) {
        nonzero = true;
        process.stderr.write(`[${id}] Exited with status ${String(code)}\n`);
        stopAll();
      }
      if (remaining === 0) process.exitCode = nonzero ? 1 : 0;
    });
  }
  return null;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    help();
  } else if (
    args.length < 1 ||
    args.length > 2 ||
    (args.length === 2 && args[1] !== "--dry-run")
  ) {
    help();
    process.exitCode = 2;
  } else {
    const result = run(args[0], { dryRun: args[1] === "--dry-run" });
    if (result !== null) process.exitCode = result;
  }
}
