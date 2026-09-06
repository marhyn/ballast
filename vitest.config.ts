import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // No tests exist yet anywhere in the monorepo — CI shouldn't fail on that.
    // Remove once the first *.test.ts lands.
    passWithNoTests: true,
    include: ["packages/*/src/**/*.test.ts", "apps/*/**/*.test.ts"],
  },
});
