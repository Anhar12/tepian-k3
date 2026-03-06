import { readFile, readdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(
  process.cwd(),
  "src/seed/utils/indonesian-countries/data",
);

/**
 * Reads and parses a JSON file.
 *
 * @param filePath - Relative path from the base directory
 * @param baseDir - Optional base directory relative to cwd. Defaults to the indonesian-countries data dir.
 * @returns Parsed JSON content
 */
async function readJsonFile<T>(filePath: string, baseDir?: string): Promise<T> {
  const dir = baseDir ? path.join(process.cwd(), baseDir) : DATA_DIR;
  const fullPath = path.join(dir, filePath);
  const text = await readFile(fullPath, "utf-8");
  return JSON.parse(text) as T;
}

/**
 * Lists all filenames in a subdirectory of the data directory.
 *
 * @param subDir - Subdirectory name within the data folder
 * @returns Array of filenames (not full paths)
 */
async function listDataFiles(subDir: string): Promise<string[]> {
  const dir = path.join(DATA_DIR, subDir);
  const entries = await readdir(dir);
  return entries.filter((f) => f.endsWith(".json"));
}

export { readJsonFile, listDataFiles };
