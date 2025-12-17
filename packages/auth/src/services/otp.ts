import type z from "zod";
import otpSchema from "@tepian-k3/schema/otp.schema";
import userQueries from "@tepian-k3/queries/users.queries";
import otpQueries from "@tepian-k3/queries/otp.queries";
import { emailService } from "@tepian-k3/services/email";
import usersQueries from "@tepian-k3/queries/users.queries";
import { encrypt } from "..";

export class OTPService {
  //   private static OTP_LENGTH = 6;
  private static OTP_EXPIRY_MINUTES = 10;
  private static MAX_ATTEMPTS = 5;

  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async createOTP(input: z.infer<typeof otpSchema.createOtpSchema>) {
    try {
      const { email } = input;

      const user = await userQueries.getUserByEmail(email);

      if (!user) {
        return {
          success: false,
          message: "Pengguna dengan email tersebut tidak ditemukan.",
        };
      }

      await otpQueries.invalidateOTPsByEmail(email);

      const code = this.generateOTP();
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      ).toISOString();

      await otpQueries.createOTP({
        userId: user.id,
        code,
        email,
        expiresAt,
        attempts: 0,
        verified: false,
      });

      // Send OTP via email using React Email template
      await emailService.sendOTP({
        email,
        code,
        expiresInMinutes: this.OTP_EXPIRY_MINUTES,
      });

      return {
        success: true,
        message: "OTP berhasil dibuat dan dikirim ke email.",
      };
    } catch (error) {
      console.error("Error creating OTP:", error);
      return {
        success: false,
        message: "Gagal membuat OTP",
        cause: error instanceof Error ? error.message : String(error),
      };
    }
  }

  static async verifyOTP(input: z.infer<typeof otpSchema.verifyOtpSchema>) {
    try {
      const { email, code } = input;

      const otp = await otpQueries.findValidOTP(email);

      if (!otp) {
        return {
          success: false,
          message: "OTP tidak ditemukan atau sudah kedaluwarsa.",
        };
      }

      if (otp.attempts >= this.MAX_ATTEMPTS) {
        return {
          success: false,
          message: "Jumlah percobaan OTP telah melebihi batas.",
        };
      }

      if (otp.code !== code) {
        await otpQueries.incrementOTPAttempts(otp.id, otp.attempts);
        return {
          success: false,
          message: "Kode OTP salah.",
        };
      }

      await otpQueries.markOTPAsVerified(otp.id);

      await usersQueries.markUserEmailAsVerified(otp.userId);

      const user = await usersQueries.getUserById(otp.userId);

      // Generate JWT token
      const token = await encrypt({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
        iat: Math.floor(Date.now() / 1000),
        jti: user.id,
      });

      return {
        success: true,
        message: "OTP berhasil diverifikasi.",
        userId: otp.userId || undefined,
        token,
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        message: "Gagal memverifikasi OTP.",
        cause: error instanceof Error ? error.message : String(error),
      };
    }
  }

  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      await otpQueries.deleteExpiredOTPs();
    } catch (error) {
      console.error("Error cleaning up OTPs:", error);
    }
  }
}
