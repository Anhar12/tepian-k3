import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 15000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    sequence: {
      concurrent: false,
    },
  },
});
