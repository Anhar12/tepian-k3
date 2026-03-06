import base from "./packages/config/eslint/base.js";
import react from "./packages/config/eslint/react.js";
import boundaries from "./packages/config/eslint/boundaries.js";

// Extract react-specific config for web app files so lint-staged
// (which runs from root) recognizes react-hooks eslint-disable comments
const reactHooksConfig = react.find(
  (config) => config.plugins?.["react-hooks"],
);

// Adapt per-package boundary rules for monorepo root context by prepending
// each affected package path. This ensures lint-staged (run from root) also
// enforces module boundaries.
const domainPackages = [
  "packages/queries",
  "packages/schema",
  "packages/api",
  "packages/db",
  "packages/types",
];

const rootBoundaries = domainPackages.flatMap((pkg) =>
  boundaries.map(({ files, ...rest }) => ({
    ...rest,
    files: files.map((f) => `${pkg}/${f}`),
  })),
);

export default [
  ...base,
  ...(reactHooksConfig
    ? [{ ...reactHooksConfig, files: ["apps/web/**/*.{ts,tsx}"] }]
    : []),
  ...rootBoundaries,
];
