import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  outDir: "./dist",
  clean: true,
  noExternal: [/@tepian-k3\/.*/],
  external: [/@node-rs\/.*/, "sharp"],
});
