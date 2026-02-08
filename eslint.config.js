import base from "./packages/config/eslint/base.js";
import react from "./packages/config/eslint/react.js";

// Extract react-specific config for web app files so lint-staged
// (which runs from root) recognizes react-hooks eslint-disable comments
const reactHooksConfig = react.find(
  (config) => config.plugins?.["react-hooks"],
);

export default [
  ...base,
  ...(reactHooksConfig
    ? [{ ...reactHooksConfig, files: ["apps/web/**/*.{ts,tsx}"] }]
    : []),
];
