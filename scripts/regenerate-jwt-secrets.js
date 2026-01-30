#!/usr/bin/env node

import fs from 'fs';
import crypto from 'crypto';

const ENV_FILE = process.argv[2] || '.env';

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.error(`Error: ${ENV_FILE} not found`);
  process.exit(1);
}

// JWT secret keys to regenerate (excludes expiry/non-secret values)
const KEYS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_RESET_PASSWORD_SECRET',
  'JWT_DOCUMENT_SECRET',
  'JWT_LEGAL_DOCUMENT_SECRET',
  'JWT_TESTING_DOCUMENT_SECRET',
  'JWT_COMPANY_DOCUMENT_SECRET',
];

// Generate a cryptographically secure random secret
function generateSecret() {
  return crypto.randomBytes(36).toString('base64');
}

console.log(`Regenerating JWT secrets in ${ENV_FILE}...`);

// Read the .env file
let envContent = fs.readFileSync(ENV_FILE, 'utf8');

// Update each key
KEYS.forEach(key => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  
  if (regex.test(envContent)) {
    const newSecret = generateSecret();
    envContent = envContent.replace(regex, `${key}=${newSecret}`);
    console.log(`  Updated: ${key}`);
  } else {
    console.log(`  Skipped: ${key} (not found)`);
  }
});

// Write the updated content back to the file
fs.writeFileSync(ENV_FILE, envContent, 'utf8');

console.log('Done. All JWT secrets have been regenerated.');