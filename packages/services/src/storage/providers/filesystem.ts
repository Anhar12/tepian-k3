import { Effect, pipe } from "effect";
import fs from "fs/promises";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import type { UploadOptions, UploadResult } from "../types";
import { UploadFailedError, FileNotFoundError } from "../types";

export class FileSystemProvider {
  private uploadsDir: string;
  private baseUrl: string;

  constructor() {
    // Simple: always use server's uploads directory
    this.uploadsDir =
      process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";

    console.log(`📁 FileSystem storage: ${this.uploadsDir}`);
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
    folder?: string
  ): { filename: string; key: string } {
    const ext = filename ? path.extname(filename) : "";
    const name = filename ? path.basename(filename, ext) : "file";
    const uniqueId = uuidv7();

    // Clean filename: remove special chars, keep only alphanumeric, dash, underscore
    const cleanName = name.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();

    // Format: uploads/[folderName]/[cleanName]-[uuid].[ext]
    const generatedFileName = `${cleanName}-${uniqueId}${ext}`;

    // Always use a folder (default to 'general' if not provided)
    const folderName = folder || "general";

    return {
      filename: generatedFileName,
      key: `${folderName}/${generatedFileName}`,
    };
  }

  upload(
    file: Buffer,
    options: UploadOptions = {}
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
            })
          )
        );
      })
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

  getSignedUrl(key: string): Effect.Effect<string> {
    // Filesystem doesn't support signed URLs, return public URL
    return Effect.succeed(this.getPublicUrl(key));
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/api/uploads/${key}`;
  }
}
