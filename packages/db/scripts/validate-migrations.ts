import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const migrationsDir = path.resolve(__dirname, "../src/migrations");
const journalPath = path.resolve(migrationsDir, "meta/_journal.json");

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

function logError(message: string) {
  console.error(`\x1b[31m[Migration Validator Error] ${message}\x1b[0m`);
}

function logSuccess(message: string) {
  console.log(`\x1b[32m[Migration Validator Success] ${message}\x1b[0m`);
}

function logWarning(message: string) {
  console.warn(`\x1b[33m[Migration Validator Warning] ${message}\x1b[0m`);
}

function validate() {
  console.log("Memulai validasi migration chain...");

  if (!fs.existsSync(journalPath)) {
    logError(`Journal file tidak ditemukan di: ${journalPath}`);
    process.exit(1);
  }

  let journal: Journal;
  try {
    const raw = fs.readFileSync(journalPath, "utf-8");
    journal = JSON.parse(raw);
  } catch (err: any) {
    logError(`Gagal membaca atau memparsing journal file: ${err.message}`);
    process.exit(1);
  }

  const entries = journal.entries;
  if (!entries || entries.length === 0) {
    logWarning("Journal tidak memiliki entri migrasi.");
    process.exit(0);
  }

  let hasErrors = false;

  // 1. Check for duplicate indexes
  const indexMap = new Map<number, JournalEntry>();
  for (const entry of entries) {
    if (indexMap.has(entry.idx)) {
      const duplicate = indexMap.get(entry.idx)!;
      logError(
        `Duplikasi index ditemukan (idx: ${entry.idx}):\n  - ${duplicate.tag}\n  - ${entry.tag}`,
      );
      hasErrors = true;
    } else {
      indexMap.set(entry.idx, entry);
    }
  }

  // 2. Check for duplicate tags
  const tagMap = new Map<string, JournalEntry>();
  for (const entry of entries) {
    if (tagMap.has(entry.tag)) {
      logError(`Duplikasi tag nama file ditemukan: ${entry.tag}`);
      hasErrors = true;
    } else {
      tagMap.set(entry.tag, entry);
    }
  }

  // 3. Verify that every entry tag has a corresponding .sql file
  const sqlFiles = new Set<string>();
  try {
    const files = fs.readdirSync(migrationsDir);
    for (const file of files) {
      if (file.endsWith(".sql")) {
        sqlFiles.add(file);
      }
    }
  } catch (err: any) {
    logError(`Gagal membaca direktori migrasi: ${err.message}`);
    process.exit(1);
  }

  for (const entry of entries) {
    const expectedFilename = `${entry.tag}.sql`;
    if (!sqlFiles.has(expectedFilename)) {
      logError(
        `File SQL migrasi untuk tag '${entry.tag}' tidak ditemukan. Diharapkan ada berkas: ${expectedFilename}`,
      );
      hasErrors = true;
    }
  }

  // 4. Verify that every .sql file in the directory is registered in the journal
  for (const file of sqlFiles) {
    const tag = file.slice(0, -4); // Remove .sql extension
    if (!tagMap.has(tag)) {
      logError(
        `File SQL migrasi '${file}' ditemukan di direktori tetapi TIDAK terdaftar di journal.`,
      );
      hasErrors = true;
    }
  }

  // 5. Warning for index gaps (non-blocking because of pre-existing gaps in prod, e.g. 10 -> 23)
  const sortedIdxs = entries.map((e) => e.idx).sort((a, b) => a - b);
  const gaps: string[] = [];
  for (let i = 0; i < sortedIdxs.length - 1; i++) {
    const current = sortedIdxs[i];
    const next = sortedIdxs[i + 1];
    if (next - current > 1) {
      gaps.push(`${current} -> ${next}`);
    }
  }

  if (gaps.length > 0) {
    logWarning(
      `Terdapat celah (gap) indeks dalam jurnal migrasi:\n${gaps
        .map((g) => `  - ${g}`)
        .join(
          "\n",
        )}\nHal ini diperbolehkan jika celah tersebut memang sudah terlanjur di-apply di production, namun pastikan tidak ada konflik saat merge branch baru.`,
    );
  }

  if (hasErrors) {
    logError("Validasi gagal! Terdapat kesalahan pada migration chain.");
    process.exit(1);
  }

  logSuccess(
    "Validasi migrasi sukses! Semua entri jurnal koheren dengan file migrasi di disk.",
  );
}

validate();
