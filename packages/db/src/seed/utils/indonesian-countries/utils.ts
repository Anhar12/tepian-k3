import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";

async function readJsonFile<T>(
  filePath: string,
  schema?: z.ZodSchema<T>,
  setDirectory?: string
): Promise<T> {
  try {
    const currentDir = process.cwd();
    const fullPath = path.join(
      currentDir,
      setDirectory ?? "src/seed/utils/indonesian-countries/",
      filePath
    );

    const text = await readFile(fullPath, "utf-8");
    const data = JSON.parse(text);

    // Validate with schema if provided
    if (schema) {
      return schema.parse(data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
    throw error;
  }
}

export { readJsonFile };
