import { Effect, pipe } from "effect";
import fs from "fs/promises";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import type { UploadOptions, UploadResult } from "../types";
import { UploadFailedError, FileNotFoundError } from "../types";
import { generateDateBasedPath } from "../utils";
import { logInfo } from "../../logger";

export class FileSystemProvider {
  private uploadsDir: string;
  private baseUrl: string;

  constructor() {
    // Simple: always use server's uploads directory
    this.uploadsDir =
      process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";

    logInfo(
      "FileSystemProvider",
      `Using uploads directory: ${this.uploadsDir}`,
    );
  }

  private ensureDir(dir: string): Effect.Effect<void, UploadFailedError> {
    return Effect.tryPromise({
      try: async () => {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
        }
      },
      catch: (error) =>
        new UploadFailedError(`Failed to create directory: ${dir}`, error),
    });
  }

  private generateKey(
    filename?: string,
    folder?: string,
  ): { filename: string; key: string } {
    const ext = filename ? path.extname(filename) : "";
    const name = filename ? path.basename(filename, ext) : "file";
    const uniqueId = uuidv7();

    // Clean filename: remove special chars, keep only alphanumeric, dash, underscore
    const cleanName = name.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();

    // Format: [folder]/[year]/[month]/[day]/[cleanName]-[uuid].[ext]
    const generatedFileName = `${cleanName}-${uniqueId}${ext}`;

    // Use date-based path with folder prefix (default to 'general' if not provided)
    const folderName = folder || "general";
    const dateBasedPath = generateDateBasedPath(folderName);

    return {
      filename: generatedFileName,
      key: `${dateBasedPath}/${generatedFileName}`,
    };
  }

  upload(
    file: Buffer,
    options: UploadOptions = {},
  ): Effect.Effect<UploadResult, UploadFailedError> {
    return pipe(
      Effect.sync(() => this.generateKey(options.filename, options.folder)),
      Effect.flatMap(({ filename, key }) => {
        const filePath = path.join(this.uploadsDir, key);
        const fileDir = path.dirname(filePath);

        return pipe(
          this.ensureDir(this.uploadsDir),
          Effect.flatMap(() => this.ensureDir(fileDir)),
          Effect.flatMap(() =>
            Effect.tryPromise({
              try: async () => {
                await fs.writeFile(filePath, file);
                return {
                  filename,
                  key,
                  url: this.getPublicUrl(key),
                  size: file.length,
                  contentType:
                    options.contentType || "application/octet-stream",
                };
              },
              catch: (error) =>
                new UploadFailedError("Failed to write file", error),
            }),
          ),
        );
      }),
    );
  }

  delete(key: string): Effect.Effect<void, FileNotFoundError> {
    const filePath = path.join(this.uploadsDir, key);

    return Effect.tryPromise({
      try: async () => {
        await fs.unlink(filePath);
      },
      catch: () => new FileNotFoundError(key),
    });
  }

  download(
    key: string,
  ): Effect.Effect<Buffer, FileNotFoundError | UploadFailedError> {
    const filePath = path.join(this.uploadsDir, key);
    return Effect.tryPromise({
      try: async () => {
        return await fs.readFile(filePath);
      },
      catch: (error: any) => {
        if (error.code === "ENOENT") {
          return new FileNotFoundError(key);
        } else {
          return new UploadFailedError("Failed to read file", error);
        }
      },
    });
  }

  getSignedUrl(key: string): Effect.Effect<string> {
    // Filesystem doesn't support signed URLs, return public URL
    return Effect.succeed(this.getPublicUrl(key));
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/api/uploads/${key}`;
  }

  getAssetUrl(key: string): string {
    return `${this.baseUrl}/api/public/${key}`;
  }

  /**
   * Extracts the folder path from a public URL
   * @param url - The public URL (e.g., http://localhost:3000/api/uploads/avatars/2026/01/09/file.jpg)
   * @returns The folder path (e.g., avatars/2026/01/09)
   */
  getFolderFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove the /api/uploads/ prefix
      const uploadsPrefix = "/api/uploads/";
      if (!pathname.startsWith(uploadsPrefix)) {
        return null;
      }

      const key = pathname.slice(uploadsPrefix.length);

      // Get directory path (remove filename)
      const lastSlashIndex = key.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        return null;
      }

      return key.slice(0, lastSlashIndex);
    } catch {
      return null;
    }
  }

  /**
   * Extracts the key (full path including filename) from a public URL or returns the key if already provided
   * @param urlOrKey - The public URL or key
   * @returns The key (e.g., avatars/2026/01/09/file.jpg)
   */
  getKeyFromUrl(urlOrKey: string): string | null {
    // If it's already a key (doesn't look like a URL), return it as-is
    if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
      // Validate it looks like a valid key (has a path structure)
      if (urlOrKey.includes("/") && urlOrKey.length > 0) {
        return urlOrKey;
      }
      return null;
    }

    // It's a URL, extract the key
    try {
      const urlObj = new URL(urlOrKey);
      const pathname = urlObj.pathname;

      const uploadsPrefix = "/api/uploads/";
      if (!pathname.startsWith(uploadsPrefix)) {
        return null;
      }

      return pathname.slice(uploadsPrefix.length);
    } catch {
      return null;
    }
  }
}
