/**
 * QR Code Generator Service for Client-Side (Browser)
 *
 * This service generates QR codes in the browser for adding to PDFs
 */

import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class QRCodeGeneratorService {
  /**
   * Generate QR code as data URL (base64 PNG)
   */
  static async generateDataURL(
    text: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: options?.errorCorrectionLevel ?? 'H',
        width: options?.width ?? 200,
        margin: options?.margin ?? 1,
        color: {
          dark: options?.color?.dark ?? '#000000',
          light: options?.color?.light ?? '#FFFFFF',
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate QR code as canvas element
   */
  static async generateCanvas(
    text: string,
    options?: QRCodeOptions
  ): Promise<HTMLCanvasElement> {
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, text, {
        errorCorrectionLevel: options?.errorCorrectionLevel ?? 'H',
        width: options?.width ?? 200,
        margin: options?.margin ?? 1,
        color: {
          dark: options?.color?.dark ?? '#000000',
          light: options?.color?.light ?? '#FFFFFF',
        },
      });
      return canvas;
    } catch (error) {
      throw new Error(`Failed to generate QR code canvas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate QR code with verification URL
   */
  static async generateVerificationQRCode(
    verificationToken: string,
    baseUrl?: string
  ): Promise<{
    qrCodeDataURL: string;
    verificationURL: string;
  }> {
    const verificationURL = `${baseUrl ?? window.location.origin}/verify/${verificationToken}`;
    const qrCodeDataURL = await this.generateDataURL(verificationURL);

    return {
      qrCodeDataURL,
      verificationURL,
    };
  }

  /**
   * Generate QR code with custom text and branding
   */
  static async generateBrandedQRCode(
    text: string,
    options?: QRCodeOptions & {
      logo?: string; // Logo data URL
      logoSize?: number; // Logo size as percentage of QR code (0-100)
    }
  ): Promise<string> {
    try {
      // Generate base QR code
      const qrCodeDataURL = await this.generateDataURL(text, options);

      // If no logo, return base QR code
      if (!options?.logo) {
        return qrCodeDataURL;
      }

      // Create canvas to add logo
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Load QR code image
      const qrImage = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = reject;
        qrImage.src = qrCodeDataURL;
      });

      // Set canvas size
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;

      // Draw QR code
      ctx.drawImage(qrImage, 0, 0);

      // Load and draw logo
      const logoImage = new Image();
      await new Promise<void>((resolve, reject) => {
        logoImage.onload = () => resolve();
        logoImage.onerror = reject;
        logoImage.src = options.logo;
      });

      // Calculate logo size (default 20% of QR code)
      const logoSizePercent = options.logoSize ?? 20;
      const logoSize = (canvas.width * logoSizePercent) / 100;
      const logoX = (canvas.width - logoSize) / 2;
      const logoY = (canvas.height - logoSize) / 2;

      // Draw white background for logo
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

      // Draw logo
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

      return canvas.toDataURL('image/png');
    } catch (error) {
      throw new Error(`Failed to generate branded QR code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate QR code text length
   */
  static validateTextLength(text: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'H'): {
    isValid: boolean;
    maxLength: number;
    currentLength: number;
  } {
    // Maximum capacity based on error correction level (approximate)
    const maxLengths = {
      L: 2953, // Low
      M: 2331, // Medium
      Q: 1663, // Quartile
      H: 1273, // High
    };

    const maxLength = maxLengths[errorCorrectionLevel];
    const currentLength = text.length;
    const isValid = currentLength <= maxLength;

    return {
      isValid,
      maxLength,
      currentLength,
    };
  }

  /**
   * Generate multiple QR codes in batch
   */
  static async generateBatch(
    items: Array<{ text: string; options?: QRCodeOptions }>
  ): Promise<Array<{ text: string; dataURL: string }>> {
    const results = await Promise.all(
      items.map(async (item) => {
        const dataURL = await this.generateDataURL(item.text, item.options);
        return {
          text: item.text,
          dataURL,
        };
      })
    );

    return results;
  }

  /**
   * Download QR code as PNG
   */
  static async downloadQRCode(
    text: string,
    filename: string,
    options?: QRCodeOptions
  ): Promise<void> {
    try {
      const dataURL = await this.generateDataURL(text, options);

      // Create download link
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(`Failed to download QR code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export convenience functions
export const generateQRCodeDataURL = QRCodeGeneratorService.generateDataURL.bind(QRCodeGeneratorService);
export const generateQRCodeCanvas = QRCodeGeneratorService.generateCanvas.bind(QRCodeGeneratorService);
export const generateVerificationQRCode = QRCodeGeneratorService.generateVerificationQRCode.bind(QRCodeGeneratorService);
export const generateBrandedQRCode = QRCodeGeneratorService.generateBrandedQRCode.bind(QRCodeGeneratorService);
export const validateQRCodeTextLength = QRCodeGeneratorService.validateTextLength.bind(QRCodeGeneratorService);
export const generateQRCodeBatch = QRCodeGeneratorService.generateBatch.bind(QRCodeGeneratorService);
export const downloadQRCode = QRCodeGeneratorService.downloadQRCode.bind(QRCodeGeneratorService);
