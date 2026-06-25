import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "auth",
      include: ["packages/auth/src/**/*.test.ts"],
      environment: "node",
      env: {
        JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
        JWT_REFRESH_SECRET:
          "test-refresh-secret-that-is-at-least-32-characters-long",
        JWT_RESET_PASSWORD_SECRET:
          "test-reset-secret-that-is-at-least-32-characters-long",
        APP_URL: "http://localhost:3000",
      },
    },
  },
  {
    test: {
      name: "schema",
      include: ["packages/schema/src/**/*.test.ts"],
      environment: "node",
    },
  },
]);
