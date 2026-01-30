export interface UploadOptions {
  filename?: string;
  contentType?: string;
  isPublic?: boolean;
  folder?: string;
}

export interface UploadResult {
  filename: string;
  key: string;
  url: string;
  size: number;
  contentType: string;
}

// Storage errors
export class StorageError extends Error {
  _tag = "StorageError";
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class FileNotFoundError extends StorageError {
  readonly _tag = "FileNotFoundError";
  constructor(key: string) {
    super(`File not found: ${key}`);
    this.name = "FileNotFoundError";
  }
}

export class UploadFailedError extends StorageError {
  readonly _tag = "UploadFailedError";
  constructor(message: string, cause?: unknown) {
    super(`Upload failed: ${message}`, cause);
    this.name = "UploadFailedError";
  }
}
