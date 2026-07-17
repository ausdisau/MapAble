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
    },
  },
});
