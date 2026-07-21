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
    return 4608;
  }
  if (process.env.GITHUB_ACTIONS === "true") {
    return 7168;
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
