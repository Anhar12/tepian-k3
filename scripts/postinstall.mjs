if (process.env.SKIP_POSTINSTALL_CHECKS === "1") {
  console.log("Skipping postinstall checks for the hosting build.");
  process.exit(0);
}

const { spawnSync } = await import("node:child_process");

const result = spawnSync("pnpm", ["check-types"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
