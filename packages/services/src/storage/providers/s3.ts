// import { Effect, pipe } from "effect";
// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
//   GetObjectCommand,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
// import { v7 as uuidv7 } from "uuid";
// import path from "path";
// import type { UploadOptions, UploadResult } from "../types";
// import { UploadFailedError, FileNotFoundError } from "../types";

// export class S3Provider {
//   private client: S3Client;
//   private bucket: string;
//   private region: string;

//   constructor() {
//     this.region = process.env.AWS_REGION || "us-east-1";
//     this.bucket = process.env.S3_BUCKET || "";

//     if (!this.bucket) {
//       throw new Error("S3_BUCKET environment variable is required");
//     }

//     this.client = new S3Client({
//       region: this.region,
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
//       },
//     });
//   }

//   private generateKey(filename?: string, folder?: string): string {
//     const ext = filename ? path.extname(filename) : "";
//     const name = filename ? path.basename(filename, ext) : "file";
//     const uniqueId = uuidv7();
//     const key = `${name}-${uniqueId}${ext}`;

//     return folder ? `${folder}/${key}` : key;
//   }

//   upload(
//     file: Buffer,
//     options: UploadOptions = {}
//   ): Effect.Effect<UploadResult, UploadFailedError> {
//     return pipe(
//       Effect.sync(() => this.generateKey(options.filename, options.folder)),
//       Effect.flatMap((key) => {
//         const command = new PutObjectCommand({
//           Bucket: this.bucket,
//           Key: key,
//           Body: file,
//           ContentType: options.contentType || "application/octet-stream",
//           ACL: options.isPublic ? "public-read" : "private",
//         });

//         return pipe(
//           Effect.tryPromise({
//             try: async () => await this.client.send(command),
//             catch: (error) => new UploadFailedError("S3 upload failed", error),
//           }),
//           Effect.flatMap(() =>
//             options.isPublic
//               ? Effect.succeed(this.getPublicUrl(key))
//               : this.getSignedUrl(key)
//           ),
//           Effect.map((url) => ({
//             key,
//             url,
//             size: file.length,
//             contentType: options.contentType || "application/octet-stream",
//           }))
//         );
//       })
//     );
//   }

//   delete(key: string): Effect.Effect<void, FileNotFoundError> {
//     const command = new DeleteObjectCommand({
//       Bucket: this.bucket,
//       Key: key,
//     });

//     return Effect.tryPromise({
//       try: async () => {
//         await this.client.send(command);
//       },
//       catch: () => new FileNotFoundError(key),
//     });
//   }

//   getSignedUrl(
//     key: string,
//     expiresIn: number = 3600
//   ): Effect.Effect<string, UploadFailedError> {
//     const command = new GetObjectCommand({
//       Bucket: this.bucket,
//       Key: key,
//     });

//     return Effect.tryPromise({
//       try: async () =>
//         await getS3SignedUrl(this.client, command, { expiresIn }),
//       catch: (error) =>
//         new UploadFailedError("Failed to generate signed URL", error),
//     });
//   }

//   getPublicUrl(key: string): string {
//     return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
//   }
// }
