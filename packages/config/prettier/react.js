import base from "./base.js";

/** @type {import("prettier").Config} */
const config = {
  ...base,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/index.css",
};

export default config;
