import { Effect } from "effect";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { env } from "../../env";
import type { DocumentEntityType, DocumentType } from "@tepian-k3/constants";

/**
 * Payload structure for document signing
 */
type DocumentSignPayload = {
  documentId: string;
  documentNumber: string;
  entityType: DocumentEntityType;
  entityId: string;
  type: DocumentType;
  fileUrl: string;
  fileHash: string; // SHA-256 hash of file content
  signedBy: string;
  signedAt: string;
};

/**
 *  Result structure for verification
 */
type VerificationResult = {
  valid: boolean;
  payload?: DocumentSignPayload;
  error?: string;
};

/**
 * Generate SHA-256 hash of file content
 */
export const generateFileHash = (content: Buffer) =>
  Effect.sync(() => crypto.createHash("sha256").update(content).digest("hex"));

/**
 * Generate secure verification token (for QR code URL parameter)
 */
export const generateVerificationToken = () =>
  Effect.sync(() => crypto.randomBytes(32).toString("hex"));

/**
 * Sign a document using JWT
 * Creates a cryptographically secure signature that can be verified
 */
export const signDocument = (
  payload: DocumentSignPayload,
  expiresIn: string = "10y", // Long expiration for archival documents
) =>
  Effect.gen(function* () {
    const secret = new TextEncoder().encode(env.JWT_DOCUMENT_SECRET);

    const jwt = yield* Effect.tryPromise({
      try: () =>
        new SignJWT({
          ...payload,
          iss: "tepian-k3", // Issuer
          aud: "document-verification", // Audience
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime(expiresIn)
          .sign(secret),
      catch: (error) =>
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sign document",
          cause: error,
        }),
    });

    return jwt;
  });

/**
 * Verify a document signature
 * Checks if the JWT is valid and hasn't been tampered with
 */
export const verifyDocumentSignature = (jwt: string) =>
  Effect.gen(function* () {
    const secret = new TextEncoder().encode(env.JWT_DOCUMENT_SECRET);

    try {
      const { payload } = yield* Effect.tryPromise({
        try: () => jwtVerify(jwt, secret),
        catch: (error) =>
          new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid document signature",
            cause: error,
          }),
      });

      return {
        valid: true,
        payload: payload as unknown as DocumentSignPayload,
      } as VerificationResult;
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      } as VerificationResult;
    }
  });

/**
 * Verify file integrity by comparing hashes
 * Ensures the file hasn't been modified since signing
 */
export const verifyFileIntegrity = (
  currentFileContent: Buffer,
  originalHash: string,
) =>
  Effect.gen(function* () {
    const currentHash = yield* generateFileHash(currentFileContent);
    return currentHash === originalHash;
  });

/**
 * Create a complete document signature with QR code data
 * Returns both the JWT signature and a verification token for the QR code
 */
export const createDocumentSignature = (
  documentId: string,
  documentNumber: string,
  entityType: DocumentEntityType,
  entityId: string,
  type: DocumentType,
  fileUrl: string,
  fileContent: Buffer,
  signedByUserId: string,
  existingVerificationToken?: string, // Optional: reuse existing token
) =>
  Effect.gen(function* () {
    // Generate file hash
    const fileHash = yield* generateFileHash(fileContent);

    // Create JWT payload
    const payload: DocumentSignPayload = {
      documentId,
      documentNumber,
      entityType,
      entityId,
      type,
      fileUrl,
      fileHash,
      signedBy: signedByUserId,
      signedAt: new Date().toISOString(),
    };

    // Sign the document (JWT for signature data)
    const signature = yield* signDocument(payload);

    // Use existing token or generate new one
    const verificationToken = existingVerificationToken
      ? existingVerificationToken
      : yield* generateVerificationToken();

    return {
      signatureData: signature, // Store this in DB
      verificationToken, // Store this in DB for QR lookup
      fileHash, // Store for integrity checks
      payload,
    };
  });

/**
 * Verify complete document authenticity
 * Checks both JWT signature and file integrity
 */
export const verifyDocumentAuthenticity = (
  signatureJWT: string,
  currentFileContent?: Buffer,
) =>
  Effect.gen(function* () {
    // Verify JWT signature
    const signatureResult = yield* verifyDocumentSignature(signatureJWT);

    if (!signatureResult.valid) {
      return {
        valid: false,
        error: signatureResult.error || "Invalid signature",
        payload: null,
      };
    }

    // If file content provided, verify file integrity
    if (currentFileContent && signatureResult.payload) {
      const fileIntact = yield* verifyFileIntegrity(
        currentFileContent,
        signatureResult.payload.fileHash,
      );

      if (!fileIntact) {
        return {
          valid: false,
          error: "File has been modified since signing",
          payload: signatureResult.payload,
        };
      }
    }

    return {
      valid: true,
      payload: signatureResult.payload,
      error: null,
    };
  });

// Export all functions
export const documentSigningService = {
  generateFileHash,
  generateVerificationToken,
  signDocument,
  verifyDocumentSignature,
  verifyFileIntegrity,
  createDocumentSignature,
  verifyDocumentAuthenticity,
};

// Export types
export type { DocumentSignPayload, VerificationResult };

// Export Helpers
export * from "./helpers";
