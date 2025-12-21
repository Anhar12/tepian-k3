import { Effect, pipe } from "effect";
import * as Minio from "minio";
import { v7 as uuidv7 } from "uuid";
import path from "path";
import type { UploadOptions, UploadResult } from "../types";
import { UploadFailedError, FileNotFoundError } from "../types";

export class MinioProvider {
  private client: Minio.Client;
  private bucket: string;
  private endpoint: string;
  private port: number;
  private useSSL: boolean;

  constructor() {
    this.endpoint = process.env.MINIO_ENDPOINT || "localhost";
    this.port = parseInt(process.env.MINIO_PORT || "9000");
    this.useSSL = process.env.MINIO_USE_SSL === "true";
    this.bucket = process.env.MINIO_BUCKET || "uploads";

    this.client = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY || "",
      secretKey: process.env.MINIO_SECRET_KEY || "",
    });
  }

  private ensureBucket(): Effect.Effect<void, UploadFailedError> {
    return Effect.tryPromise({
      try: async () => {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
          await this.client.makeBucket(this.bucket, "");
        }
      },
      catch: (error) =>
        new UploadFailedError("Failed to ensure bucket exists", error),
    });
  }

  private generateKey(
    filename?: string,
    folder?: string
  ): {
    filename: string;
    key: string;
  } {
    const ext = filename ? path.extname(filename) : "";
    const name = filename ? path.basename(filename, ext) : "file";
    const uniqueId = uuidv7();
    const key = `${name}-${uniqueId}${ext}`;

    return {
      filename: key,
      key: folder ? `${folder}/${key}` : key,
    };
  }

  upload(
    file: Buffer,
    options: UploadOptions = {}
  ): Effect.Effect<UploadResult, UploadFailedError> {
    return pipe(
      this.ensureBucket(),
      Effect.flatMap(() =>
        Effect.sync(() => this.generateKey(options.filename, options.folder))
      ),
      Effect.flatMap(({ filename, key }) => {
        const metadata = {
          "Content-Type": options.contentType || "application/octet-stream",
        };

        return pipe(
          Effect.tryPromise({
            try: async () => {
              await this.client.putObject(
                this.bucket,
                key,
                file,
                file.length,
                metadata
              );
            },
            catch: (error) =>
              new UploadFailedError("MinIO upload failed", error),
          }),
          Effect.flatMap(() =>
            options.isPublic
              ? Effect.succeed(this.getPublicUrl(key))
              : this.getSignedUrl(key)
          ),
          Effect.map((url) => ({
            filename,
            key,
            url,
            size: file.length,
            contentType: options.contentType || "application/octet-stream",
          }))
        );
      })
    );
  }

  delete(key: string): Effect.Effect<void, FileNotFoundError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.removeObject(this.bucket, key);
      },
      catch: () => new FileNotFoundError(key),
    });
  }

  getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Effect.Effect<string, UploadFailedError> {
    return Effect.tryPromise({
      try: async () =>
        await this.client.presignedGetObject(this.bucket, key, expiresIn),
      catch: (error) =>
        new UploadFailedError("Failed to generate signed URL", error),
    });
  }

  getPublicUrl(key: string): string {
    const protocol = this.useSSL ? "https" : "http";
    return `${protocol}://${this.endpoint}:${this.port}/${this.bucket}/${key}`;
  }
}
