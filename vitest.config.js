import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests-js/**/*.test.js", "src/tests-js/**/*.spec.js"],
    environment: "node",
    benchmark: {
      include: ["src/tests-js/**/*.bench.js"],
    },
  },
  esbuild: {
    target: "es2020",
  },
});
