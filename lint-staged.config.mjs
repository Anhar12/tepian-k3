export default {
  "**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}": (files) => {
    const filtered = files.filter((f) => !f.endsWith("routeTree.gen.ts"));
    if (filtered.length === 0) return [];
    const paths = filtered.join(" ");
    return [`npx eslint --fix ${paths}`, `npx prettier --write ${paths}`];
  },
  "**/*.{json,md,css}": "npx prettier --write",
};
