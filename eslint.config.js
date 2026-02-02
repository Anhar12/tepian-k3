import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import tepian from "./packages/config/eslint-plugin-tepian/index.js";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/drizzle/**",
      "**/migrations/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: {
      tepian,
    },
    rules: {
      "tepian/no-img-element": "error",
    },
  },
);
