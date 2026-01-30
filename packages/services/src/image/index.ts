import { Effect } from "effect";
import sharp from "sharp";
import type { ImageConversionOptions, ConversionResult } from "./types";
import { InvalidImageError } from "./types";

class ImageService {
  /**
   * Convert any image to WebP format
   * Supports JPEG, PNG, GIF, TIFF, WebP, and other formats supported by sharp
   */
  convertToWebP(
    imageBuffer: Buffer,
    options: ImageConversionOptions = {},
  ): Effect.Effect<ConversionResult, InvalidImageError> {
    return Effect.tryPromise({
      try: async () => {
        const {
          quality = 80,
          maxWidth,
          maxHeight,
          preserveMetadata = false,
          effort = 4,
          filename,
        } = options;

        // Get original image metadata
        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.format) {
          throw new InvalidImageError("Unable to determine image format");
        }

        // Store original stats
        const originalSize = imageBuffer.length;
        const originalFormat = metadata.format;

        // Create sharp instance
        let pipeline = sharp(imageBuffer);

        // Resize if dimensions are specified
        if (maxWidth || maxHeight) {
          pipeline = pipeline.resize({
            width: maxWidth,
            height: maxHeight,
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        // Convert to WebP with specified options
        pipeline = pipeline.webp({
          quality,
          effort,
        });

        // Preserve metadata if requested
        if (preserveMetadata) {
          pipeline = pipeline.withMetadata();
        }

        // Execute conversion
        const convertedBuffer = await pipeline.toBuffer();
        const convertedMetadata = await sharp(convertedBuffer).metadata();

        // Calculate compression ratio
        const convertedSize = convertedBuffer.length;
        const compressionRatio =
          ((originalSize - convertedSize) / originalSize) * 100;

        // Convert filename extension if provided
        const convertedFilename = filename
          ? filename.replace(/\.[^.]+$/, ".webp")
          : undefined;

        return {
          buffer: convertedBuffer,
          originalFormat,
          originalSize,
          convertedSize,
          compressionRatio: Math.round(compressionRatio * 100) / 100,
          width: convertedMetadata.width || 0,
          height: convertedMetadata.height || 0,
          filename: convertedFilename,
        };
      },
      catch: (error) => {
        if (error instanceof InvalidImageError) {
          return error;
        }
        return new InvalidImageError(
          error instanceof Error ? error.message : "Unknown error occurred",
          error,
        );
      },
    });
  }

  /**
   * Validate if a buffer contains a valid image
   */
  validateImage(
    imageBuffer: Buffer,
  ): Effect.Effect<boolean, InvalidImageError> {
    return Effect.tryPromise({
      try: async () => {
        const metadata = await sharp(imageBuffer).metadata();
        return !!metadata.format;
      },
      catch: (error) => {
        return new InvalidImageError(
          error instanceof Error ? error.message : "Invalid image format",
          error,
        );
      },
    });
  }

  /**
   * Get image metadata without conversion
   */
  getImageInfo(imageBuffer: Buffer): Effect.Effect<
    {
      format: string;
      width: number;
      height: number;
      size: number;
      hasAlpha: boolean;
    },
    InvalidImageError
  > {
    return Effect.tryPromise({
      try: async () => {
        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.format) {
          throw new InvalidImageError("Unable to determine image format");
        }

        return {
          format: metadata.format,
          width: metadata.width || 0,
          height: metadata.height || 0,
          size: imageBuffer.length,
          hasAlpha: !!metadata.hasAlpha,
        };
      },
      catch: (error) => {
        return new InvalidImageError(
          error instanceof Error ? error.message : "Unable to read image info",
          error,
        );
      },
    });
  }
}

export const imageService = new ImageService();

export { ImageService };
export type { ImageConversionOptions, ConversionResult };
export { ImageConversionError, InvalidImageError } from "./types";
