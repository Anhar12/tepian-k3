#!/usr/bin/env node

import fs from "fs";
import crypto from "crypto";
import path from "path";

const ROOT_DIR = process.argv[2] || process.cwd();

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".turbo",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".output",
  "coverage",
]);

// JWT secret keys to regenerate (excludes expiry/non-secret values)
const KEYS = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_RESET_PASSWORD_SECRET",
  "JWT_DOCUMENT_SECRET",
  "JWT_LEGAL_DOCUMENT_SECRET",
  "JWT_TESTING_DOCUMENT_SECRET",
  "JWT_COMPANY_DOCUMENT_SECRET",
];

// Generate a cryptographically secure random secret
function generateSecret() {
  return crypto.randomBytes(36).toString("base64");
}

function findEnvFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        results.push(...findEnvFiles(fullPath));
      }
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.startsWith(".env") &&
      !entry.name.endsWith(".example")
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

if (!fs.existsSync(ROOT_DIR)) {
  console.error(`Error: root directory not found: ${ROOT_DIR}`);
  process.exit(1);
}

const envFiles = findEnvFiles(ROOT_DIR).sort();
if (envFiles.length === 0) {
  console.log(`No .env* files found under: ${ROOT_DIR}`);
  process.exit(0);
}

console.log(
  `Found ${envFiles.length} .env* file(s). Regenerating JWT secrets...`,
);

envFiles.forEach((envFile) => {
  let envContent = fs.readFileSync(envFile, "utf8");
  let updatedCount = 0;

  KEYS.forEach((key) => {
    const regex = new RegExp(`^${key}=.*$`, "m");

    if (regex.test(envContent)) {
      const newSecret = generateSecret();
      envContent = envContent.replace(regex, `${key}=${newSecret}`);
      updatedCount += 1;
    }
  });

  fs.writeFileSync(envFile, envContent, "utf8");
  const relativeFile = path.relative(ROOT_DIR, envFile) || envFile;
  console.log(`  ${relativeFile}: updated ${updatedCount} key(s)`);
});

console.log("Done. JWT secrets regenerated across all .env* files.");
