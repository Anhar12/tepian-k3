#!/usr/bin/env node

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "Usage: node scripts/create-changeset-from-commit.mjs <commit-ish> [--bump patch|minor|major]",
  );
  process.exit(1);
}

const commitRef = args[0];
const bumpArgIndex = args.findIndex((arg) => arg === "--bump");
const bumpType =
  bumpArgIndex !== -1 && args[bumpArgIndex + 1]
    ? args[bumpArgIndex + 1]
    : "patch";

const validBumps = new Set(["patch", "minor", "major"]);
if (!validBumps.has(bumpType)) {
  console.error("Invalid bump type. Use one of: patch, minor, major.");
  process.exit(1);
}

function run(command) {
  return execSync(command, { cwd, encoding: "utf8" }).trim();
}

function safeSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function discoverWorkspacePackages() {
  const packageDirs = ["apps", "packages"];
  const map = new Map();

  for (const rootDir of packageDirs) {
    const absoluteRoot = path.join(cwd, rootDir);
    if (!existsSync(absoluteRoot)) continue;

    for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgDir = path.join(absoluteRoot, entry.name);
      const pkgJsonPath = path.join(pkgDir, "package.json");
      if (!existsSync(pkgJsonPath)) continue;

      try {
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
        if (!pkgJson.name) continue;
        const relativeDir = path.relative(cwd, pkgDir).replace(/\\/g, "/");
        map.set(relativeDir, pkgJson.name);
      } catch {
        // Ignore malformed package.json and continue
      }
    }
  }

  return map;
}

function changedFilesFromCommit(ref) {
  const output = run(`git show --name-only --pretty=format: ${ref}`);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function commitSubjectFromRef(ref) {
  return run(`git show -s --format=%s ${ref}`);
}

function mapFilesToPackages(files, packageMap) {
  const packages = new Set();
  const packageDirs = Array.from(packageMap.keys()).sort(
    (a, b) => b.length - a.length,
  );

  for (const file of files) {
    const normalized = file.replace(/\\/g, "/");
    for (const pkgDir of packageDirs) {
      if (normalized === pkgDir || normalized.startsWith(`${pkgDir}/`)) {
        packages.add(packageMap.get(pkgDir));
        break;
      }
    }
  }

  return Array.from(packages).sort();
}

const subject = commitSubjectFromRef(commitRef);
const files = changedFilesFromCommit(commitRef);
const packageMap = discoverWorkspacePackages();
const changedPackages = mapFilesToPackages(files, packageMap);

if (changedPackages.length === 0) {
  console.error(
    "No workspace packages detected from this commit. Check commit hash or changed file paths.",
  );
  process.exit(1);
}

const changesetDir = path.join(cwd, ".changeset");
if (!existsSync(changesetDir)) {
  mkdirSync(changesetDir, { recursive: true });
}

const slugBase = safeSlug(subject) || "commit-change";
const filename = `${slugBase}-${Date.now()}.md`;
const filePath = path.join(changesetDir, filename);

const frontmatter = changedPackages
  .map((pkg) => `"${pkg}": ${bumpType}`)
  .join("\n");
const summary = `- ${subject}\n- Affected files: ${files.length}`;
const content = `---\n${frontmatter}\n---\n\n${summary}\n`;

writeFileSync(filePath, content, "utf8");

console.log(`Created changeset: .changeset/${filename}`);
console.log(`Packages: ${changedPackages.join(", ")}`);
