#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const args = process.argv.slice(2);

function flagValue(flag) {
  const i = args.findIndex((a) => a === flag);
  return i !== -1 ? (args[i + 1] ?? null) : null;
}

const weeksValue = flagValue("--weeks");
const daysValue = flagValue("--days");
const sinceValue = flagValue("--since");
const hasRange =
  weeksValue !== null || daysValue !== null || sinceValue !== null;
const commitRef = hasRange ? null : (args[0] ?? null);

if (!commitRef && !hasRange) {
  console.error(
    "Usage:\n" +
      "  node scripts/list-commit-packages.mjs <commit-ish>\n" +
      "  node scripts/list-commit-packages.mjs --weeks 2\n" +
      "  node scripts/list-commit-packages.mjs --days 14\n" +
      "  node scripts/list-commit-packages.mjs --since '2026-02-01'",
  );
  process.exit(1);
}

function run(command) {
  return execSync(command, { cwd, encoding: "utf8" }).trim();
}

/**
 * Discovers all workspace packages under apps/ and packages/.
 *
 * @returns {Map<string, string>} Map of relative directory → package name
 */
function discoverWorkspacePackages() {
  const rootDirs = ["apps", "packages"];
  const map = new Map();

  for (const rootDir of rootDirs) {
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
        // Ignore malformed package.json
      }
    }
  }

  return map;
}

/**
 * Returns the subject and optional body of a single commit.
 *
 * @param {string} ref - Commit-ish reference
 * @returns {{ subject: string; body: string }}
 */
function getCommitInfo(ref) {
  const raw = run(`git show -s --format=%s%n---BODY---%n%b ${ref}`);
  const delimIndex = raw.indexOf("---BODY---");
  const subject = raw.slice(0, delimIndex).trim();
  const body = raw.slice(delimIndex + "---BODY---".length).trim();
  return { subject, body };
}

/**
 * Returns the list of files changed in a single commit.
 *
 * @param {string} ref - Commit-ish reference
 * @returns {string[]}
 */
function changedFilesFromCommit(ref) {
  const output = run(`git show --name-only --pretty=format: ${ref}`);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Returns all commits since the given ISO date string.
 *
 * @param {string} isoDate - ISO 8601 date string passed to git --since
 * @returns {{ hash: string; subject: string; body: string }[]}
 */
function getCommitsSince(isoDate) {
  const raw = run(`git log --since="${isoDate}" --format=%H%x1f%s%x1f%b%x1e`);

  return raw
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, ...bodyParts] = record.split("\x1f");
      return {
        hash: (hash ?? "").trim(),
        subject: (subject ?? "").trim(),
        body: bodyParts.join("").trim(),
      };
    })
    .filter((c) => c.hash);
}

/**
 * Returns all unique files changed across commits since the given ISO date.
 *
 * @param {string} isoDate - ISO 8601 date string passed to git --since
 * @returns {string[]}
 */
function changedFilesInRange(isoDate) {
  const output = run(
    `git log --since="${isoDate}" --name-only --pretty=format:`,
  );
  return [
    ...new Set(
      output
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Maps a list of file paths to the workspace package names that own them.
 *
 * @param {string[]} files
 * @param {Map<string, string>} packageMap
 * @returns {string[]}
 */
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

/**
 * Parses a semver string into its numeric components.
 *
 * @param {string} version
 * @returns {{ major: number; minor: number; patch: number } | null}
 */
function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Applies a semver bump level to a version string and returns the new version.
 *
 * @param {string} currentVersion
 * @param {'major' | 'minor' | 'patch' | 'none'} bump
 * @returns {string}
 */
function applyBump(currentVersion, bump) {
  const parsed = parseSemver(currentVersion);
  if (!parsed || bump === "none") return currentVersion;
  const { major, minor, patch } = parsed;
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  return currentVersion;
}

/**
 * Reads the version field from a package's package.json.
 *
 * @param {string | undefined} pkgDir - Relative path to the package directory
 * @returns {string}
 */
function getPackageVersion(pkgDir) {
  if (!pkgDir) return "0.0.0";
  const pkgJsonPath = path.join(cwd, pkgDir, "package.json");
  try {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    return pkgJson.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Builds a map of package name → commits that touched that package.
 * Makes one `git show` call per commit to determine per-commit file changes.
 *
 * @param {{ hash: string; subject: string; body: string }[]} commits
 * @param {Map<string, string>} packageMap
 * @returns {Map<string, { subject: string; body: string }[]>}
 */
function mapCommitsToPackages(commits, packageMap) {
  const result = new Map();
  for (const commit of commits) {
    const files = changedFilesFromCommit(commit.hash);
    const pkgs = mapFilesToPackages(files, packageMap);
    for (const pkg of pkgs) {
      if (!result.has(pkg)) result.set(pkg, []);
      result.get(pkg).push(commit);
    }
  }
  return result;
}

/**
 * Formats a Date as "YYYY-MM-DD".
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Extracts the description from a conventional commit subject line,
 * stripping the "type(scope): " prefix.
 *
 * @param {string} subject
 * @returns {string}
 */
function extractDescription(subject) {
  const match = /^\w+(?:\([^)]*\))?!?\s*:\s*(.+)/.exec(subject);
  return match ? match[1].trim() : subject.trim();
}

/**
 * Generates a ready-to-copy conventional commit message derived from the
 * bump level, affected package names, and the commits that drove the bump.
 *
 * Subject is auto-derived by extracting descriptions from the commits that
 * match the bump level (feat for minor, fix/perf/etc for patch, breaking for
 * major), then joining them within the 72-character subject limit.
 *
 * @param {'major' | 'minor' | 'patch' | 'none'} bump
 * @param {string[]} packages - Affected package names (e.g. "@tepian-k3/api")
 * @param {{ subject: string; body: string }[]} commits
 * @returns {string}
 */
function suggestCommitMessage(bump, packages, commits) {
  const type =
    bump === "major"
      ? "feat!"
      : bump === "minor"
        ? "feat"
        : bump === "patch"
          ? "fix"
          : "chore";
  const scopes = packages
    .map((p) => p.replace(/^@[^/]+\//, "")) // strip namespace prefix
    .join(",");
  const scope = scopes ? `(${scopes})` : "";
  const prefix = `${type}${scope}: `;

  const subjectRe = /^(?<type>\w+)(?:\([^)]*\))?(?<breaking>!)?\s*:/;
  const patchTypes = new Set([
    "fix",
    "perf",
    "refactor",
    "revert",
    "improvement",
  ]);

  // Keep only commits that drove the bump level
  let relevant;
  if (bump === "major") {
    relevant = commits.filter(
      (c) =>
        subjectRe.exec(c.subject)?.groups?.breaking === "!" ||
        /BREAKING[ -]CHANGE:/i.test(c.body ?? ""),
    );
  } else if (bump === "minor") {
    relevant = commits.filter(
      (c) => subjectRe.exec(c.subject)?.groups?.type === "feat",
    );
  } else if (bump === "patch") {
    relevant = commits.filter((c) =>
      patchTypes.has(subjectRe.exec(c.subject)?.groups?.type ?? ""),
    );
  } else {
    relevant = commits;
  }

  if (relevant.length === 0) relevant = commits;

  // Deduplicated plain descriptions
  const descs = [
    ...new Set(relevant.map((c) => extractDescription(c.subject))),
  ];

  const header = `${prefix}${descs[0] ?? "<subject>"}`;
  const bodyLines = descs.map((d) => `- ${d}`);

  return { header, bodyLines };
}

/**
 * Derives a semver bump recommendation from a list of conventional commits.
 *
 * Rules (in priority order):
 *  - major: subject has `!` after type, OR body/footer contains "BREAKING CHANGE:"
 *  - minor: type is `feat`
 *  - patch: type is `fix`, `perf`, `refactor`, `revert`, or any other known type
 *  - none:  type is `chore`, `docs`, `style`, `test`, `ci`, `build`
 *
 * @param {{ subject: string; body: string }[]} commits
 * @returns {{ bump: 'major' | 'minor' | 'patch' | 'none'; reasons: string[] }}
 */
function recommendBump(commits) {
  const reasons = [];
  let bump = "none";

  const raise = (level, reason) => {
    const order = { none: 0, patch: 1, minor: 2, major: 3 };
    if (order[level] > order[bump]) bump = level;
    reasons.push(reason);
  };

  // Conventional commit subject pattern: type(scope)!: description
  const subjectRe = /^(?<type>\w+)(?:\([^)]*\))?(?<breaking>!)?\s*:/;

  // Patch-level types (changes behaviour but not API)
  const patchTypes = new Set([
    "fix",
    "perf",
    "refactor",
    "revert",
    "improvement",
  ]);
  // No-release types
  const noneTypes = new Set([
    "chore",
    "docs",
    "style",
    "test",
    "ci",
    "build",
    "wip",
  ]);

  for (const { subject, body } of commits) {
    const match = subjectRe.exec(subject);
    const type = match?.groups?.type ?? "";
    const isBreaking =
      match?.groups?.breaking === "!" ||
      /BREAKING[ -]CHANGE:/i.test(body ?? "");

    if (isBreaking) {
      raise("major", `breaking change in "${subject}"`);
      continue;
    }

    if (type === "feat") {
      raise("minor", `new feature: "${subject}"`);
    } else if (patchTypes.has(type)) {
      raise("patch", `${type}: "${subject}"`);
    } else if (!noneTypes.has(type) && type) {
      // Unknown type — treat as patch to be safe
      raise("patch", `unknown type "${type}": "${subject}"`);
    }
  }

  return { bump, reasons };
}

// ── Single-commit mode ────────────────────────────────────────────────────────
if (commitRef) {
  const { subject, body } = getCommitInfo(commitRef);
  const files = changedFilesFromCommit(commitRef);
  const packageMap = discoverWorkspacePackages();
  const changedPackages = mapFilesToPackages(files, packageMap);
  const { bump, reasons } = recommendBump([{ subject, body }]);

  console.log("");
  console.log(`Commit:   ${commitRef}`);
  console.log(`Message:  ${subject}`);
  if (body) {
    const indented = body
      .split("\n")
      .map((line) => `          ${line}`)
      .join("\n");
    console.log(`Body:\n${indented}`);
  }
  console.log(`Files:    ${files.length} changed`);
  console.log("");

  const reversePkgMap = new Map(
    Array.from(packageMap.entries()).map(([dir, name]) => [name, dir]),
  );

  if (changedPackages.length === 0) {
    console.log("Packages: (none detected in workspace)");
  } else {
    console.log(`Packages: ${changedPackages.length} affected`);
    for (const pkg of changedPackages) {
      const dir = reversePkgMap.get(pkg);
      const currentVer = getPackageVersion(dir);
      const newVer = applyBump(currentVer, bump);
      const versionInfo =
        bump !== "none"
          ? `  ${currentVer} → ${newVer}`
          : `  ${currentVer} (no change)`;
      console.log(`  - ${pkg}${versionInfo}  [${bump.toUpperCase()}]`);
    }
  }

  console.log("");
  console.log(
    `Bump rec: ${bump.toUpperCase()}${bump === "none" ? " (no release needed)" : ""}`,
  );
  for (const reason of reasons) {
    console.log(`  → ${reason}`);
  }

  const { header: singleHeader } = suggestCommitMessage(bump, changedPackages, [
    { subject, body },
  ]);
  console.log("");
  console.log("Suggested:");
  console.log(singleHeader);
  console.log("");
}

// ── Range mode (--weeks / --days / --since) ───────────────────────────────────
if (hasRange) {
  let fromDate;
  let rangeLabel;

  if (weeksValue !== null) {
    const weeks = parseInt(weeksValue, 10);
    if (Number.isNaN(weeks) || weeks < 1) {
      console.error("--weeks must be a positive integer.");
      process.exit(1);
    }
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - weeks * 7);
    rangeLabel = `last ${weeks} week${weeks === 1 ? "" : "s"} (since ${formatDate(fromDate)})`;
  } else if (daysValue !== null) {
    const days = parseInt(daysValue, 10);
    if (Number.isNaN(days) || days < 1) {
      console.error("--days must be a positive integer.");
      process.exit(1);
    }
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    rangeLabel = `last ${days} day${days === 1 ? "" : "s"} (since ${formatDate(fromDate)})`;
  } else {
    fromDate = new Date(sinceValue);
    if (Number.isNaN(fromDate.getTime())) {
      console.error(`Could not parse date: "${sinceValue}"`);
      process.exit(1);
    }
    rangeLabel = `since ${formatDate(fromDate)}`;
  }

  const isoDate = fromDate.toISOString();
  const commits = getCommitsSince(isoDate);
  const allFiles = changedFilesInRange(isoDate);
  const packageMap = discoverWorkspacePackages();
  const changedPackages = mapFilesToPackages(allFiles, packageMap);

  console.log("");
  console.log(`Range:    ${rangeLabel}`);
  console.log(`Commits:  ${commits.length}`);
  console.log("");

  for (const commit of commits) {
    console.log(`  ${commit.hash.slice(0, 7)}  ${commit.subject}`);
    if (commit.body) {
      for (const line of commit.body.split("\n").filter(Boolean)) {
        console.log(`           ${line}`);
      }
    }
  }

  console.log("");
  console.log(`Files changed: ${allFiles.length} unique`);
  console.log("");

  const reversePkgMap = new Map(
    Array.from(packageMap.entries()).map(([dir, name]) => [name, dir]),
  );
  const pkgCommitsMap = mapCommitsToPackages(commits, packageMap);

  if (changedPackages.length === 0) {
    console.log("Packages: (none detected in workspace)");
  } else {
    console.log(`Packages affected: ${changedPackages.length}`);
    for (const pkg of changedPackages) {
      const pkgCommits = pkgCommitsMap.get(pkg) ?? [];
      const { bump: pkgBump } = recommendBump(pkgCommits);
      const dir = reversePkgMap.get(pkg);
      const currentVer = getPackageVersion(dir);
      const newVer = applyBump(currentVer, pkgBump);
      const versionInfo =
        pkgBump !== "none"
          ? `  ${currentVer} → ${newVer}`
          : `  ${currentVer} (no change)`;
      console.log(`  - ${pkg}${versionInfo}  [${pkgBump.toUpperCase()}]`);
    }
  }

  const { bump, reasons } = recommendBump(commits);

  console.log("");
  console.log(
    `Bump rec: ${bump.toUpperCase()}${bump === "none" ? " (no release needed)" : ""}`,
  );
  for (const reason of reasons.slice(0, 5)) {
    console.log(`  → ${reason}`);
  }
  if (reasons.length > 5) {
    console.log(`  → … and ${reasons.length - 5} more`);
  }

  const { header: rangeHeader, bodyLines } = suggestCommitMessage(
    bump,
    changedPackages,
    commits,
  );
  console.log("");
  console.log("Suggested:");
  console.log(rangeHeader);
  if (bodyLines.length > 0) {
    console.log("");
    for (const line of bodyLines) {
      console.log(line);
    }
  }
  console.log("");
}
