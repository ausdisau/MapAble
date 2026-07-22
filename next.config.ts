import type { NextConfig } from "next";

import { assertDeployedProductionEnv } from "./lib/env/assert-deployed-production-env";
import { getBaselineSecurityHeaders } from "./lib/security/headers";

// Fail closed on real Vercel production builds when env is invalid.
// Local/CI builds (no VERCEL_ENV=production) remain usable.
assertDeployedProductionEnv(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  // Vercel default build machines are 8 GB; leave headroom so lint+tsc
  // workers are not SIGKILL'd (OOM) during production deploys of main.
  // staticGenerationMaxConcurrency defaults to 8 and can OOM GitHub’s ~7 GB
  // runners during “Generating static pages” even when cpus=1 (seen on #382).
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    // Fewer workers / larger page batches reduce peak RSS on Vercel preview.
    // Raised from 100 after preview SIGKILL at 6144 MB heap (PR #390).
    staticGenerationMinPagesPerWorker: 200,
  },
  async redirects() {
    return [
      {
        // Public employment module is canonical; keep /jobs as a compatibility alias.
        source: "/jobs",
        destination: "/employment",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getBaselineSecurityHeaders(),
      },
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=43200, s-maxage=43200", // 5 days
          },
        ],
      },
    ];
  },
  eslint: {
    // Build fails when lint fails (ignoreDuringBuilds removed — remediation PR 1).
    // tests/ linted via `pnpm lint:tests` (tracked debt; not ignored during builds for app code).
    dirs: ["app", "components", "lib", "schemas", "scripts/ci"],
  },
  typescript: {
    ignoreBuildErrors: false, // Ensures type safety at build time
  },
};

export default nextConfig;
