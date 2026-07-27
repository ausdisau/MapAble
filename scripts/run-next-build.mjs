#!/usr/bin/env node
/**
 * Next.js production build with environment-aware heap caps.
 *
 * Vercel preview builders SIGKILL when Node heap is set near the container RSS
 * limit (observed with --max-old-space-size=7168). GitHub Accessibility needs a
 * higher ceiling after SSG concurrency was reduced to 1.
 *
 * Override with MAPABLE_BUILD_HEAP_MB when needed.
 */
import { spawnSync } from "node:child_process";

function resolveHeapMb() {
  const override = process.env.MAPABLE_BUILD_HEAP_MB;
  if (override && Number.isFinite(Number(override))) {
    return Number(override);
  }
  if (process.env.VERCEL === "1") {
    // History on default ~8 GB Vercel builders (PR #390 / #413):
    // - 7168 → SIGKILL (RSS)
    // - 5632 → JS heap OOM during lint+tsc when eslint ran in-build
    // - 6144 → still SIGKILL with eslint in-build (dpl_9cgbYumEJum…)
    // With eslint.ignoreDuringBuilds on Vercel only (CI still lints), keep
    // headroom under the container RSS limit for tsc + SSG.
    // If SIGKILL persists: OWNER_ACTION_REQUIRED — larger Vercel build machine.
    return 5120;
  }
  if (process.env.GITHUB_ACTIONS === "true") {
    // Codebase growth after lib nesting / CareOS waves needs more SSG headroom
    // than the prior 7168 MB tip (JS heap OOM on CI/Accessibility/CSP).
    // Override with MAPABLE_BUILD_HEAP_MB; do not raise Vercel above 5120.
    return 8192;
  }
  return 6144;
}

const heapMb = resolveHeapMb();
console.log(`[run-next-build] max-old-space-size=${heapMb}`);

const result = spawnSync(
  process.execPath,
  [
    `--max-old-space-size=${heapMb}`,
    "node_modules/next/dist/bin/next",
    "build",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      // Avoid a parent NODE_OPTIONS heap fighting the explicit flag above.
      NODE_OPTIONS: (process.env.NODE_OPTIONS || "")
        .split(/\s+/)
        .filter(Boolean)
        .filter((part) => !part.startsWith("--max-old-space-size"))
        .join(" "),
    },
  },
);

process.exit(result.status ?? 1);
