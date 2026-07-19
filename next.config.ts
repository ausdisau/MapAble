import type { NextConfig } from "next";

import { getBaselineSecurityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  // Vercel default build machines are 8 GB; leave headroom so lint+tsc
  // workers are not SIGKILL'd (OOM) during production deploys of main.
  experimental: {
    cpus: 1,
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
