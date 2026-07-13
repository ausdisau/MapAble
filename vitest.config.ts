import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
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
    },
  },
});
