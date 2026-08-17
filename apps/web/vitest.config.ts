import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["tests/a11y/**", "node_modules/**"],
    env: {
      // Dedicated encryption in unit tests; never use session secrets.
      MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK: "true",
      MAPABLE_REQUIRE_ADMIN_BREAK_GLASS: "false",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@mapable/contracts": path.resolve(
        __dirname,
        "packages/contracts/src/index.ts"
      ),
      "@mapable/intelligence-kernel": path.resolve(
        __dirname,
        "packages/intelligence-kernel/src/index.ts"
      ),
      "@mapable/domain-transport": path.resolve(
        __dirname,
        "packages/domain-transport/src/index.ts"
      ),
      "@mapable/domain-provider": path.resolve(
        __dirname,
        "packages/domain-provider/src/index.ts"
      ),
      "@mapable/domain-workforce": path.resolve(
        __dirname,
        "packages/domain-workforce/src/index.ts"
      ),
    },
  },
});
