import react from "@tepian-k3/config/eslint/react.js";
import pluginRouter from "@tanstack/eslint-plugin-router";

export default [
  ...react,
  ...pluginRouter.configs["flat/recommended"],
  {
    ignores: ["dev-dist/**"],
  },
];
