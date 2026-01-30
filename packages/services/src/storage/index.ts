import { Effect } from "effect";
import type { UploadOptions, UploadResult } from "./types";
import { StorageError, UploadFailedError, FileNotFoundError } from "./types";
import { FileSystemProvider } from "./providers/filesystem";
// import { S3Provider } from "./providers/s3";
import { MinioProvider } from "./providers/minio";

type StorageType = "filesystem" | "s3" | "minio";

// Uncomment when S3 provider is implemented
// type StorageProvider = FileSystemProvider | S3Provider | MinioProvider;

type StorageProvider = FileSystemProvider | MinioProvider;

class StorageService {
  private provider: StorageProvider;

  constructor() {
    const storageType = (process.env.STORAGE_TYPE ||
      "filesystem") as StorageType;

    switch (storageType) {
      //   case "s3":
      //     this.provider = new S3Provider();
      //     break;
      case "minio":
        this.provider = new MinioProvider();
        break;
      case "filesystem":
      default:
        this.provider = new FileSystemProvider();
        break;
    }
  }

  upload(
    file: Buffer,
    options: UploadOptions = {},
  ): Effect.Effect<UploadResult, UploadFailedError> {
    return this.provider.upload(file, options);
  }

  delete(key: string): Effect.Effect<void, FileNotFoundError> {
    return this.provider.delete(key);
  }

  download(
    key: string,
  ): Effect.Effect<Buffer, FileNotFoundError | UploadFailedError> {
    return this.provider.download(key);
  }

  getSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Effect.Effect<string, UploadFailedError | never> {
    return this.provider.getSignedUrl(key, expiresIn);
  }

  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }

  getAssetUrl(key: string): string {
    return this.provider.getAssetUrl(key);
  }

  getFolderFromUrl(url: string): string | null {
    return this.provider.getFolderFromUrl(url);
  }

  getKeyFromUrl(url: string): string | null {
    return this.provider.getKeyFromUrl(url);
  }
}

export const storageService = new StorageService();

export { StorageService };
export type { UploadOptions, UploadResult, StorageType };
export { StorageError, UploadFailedError, FileNotFoundError };
