import usersQueries from "@tepian-k3/queries/users.queries";
import { Data, Effect } from "effect";
import { decryptResetToken, encryptResetToken } from "..";
import { logError } from "@tepian-k3/services/logger";
import passwordResetsQueries from "@tepian-k3/queries/password-resets.queries";
import { env } from "../../env";
import { emailService } from "@tepian-k3/services/email";
import { db } from "@tepian-k3/db/client";

class PasswordResetError extends Data.TaggedError("PasswordResetError")<{
  status: boolean;
  message: string;
}> {}

export class PasswordResetService {
  private static RESET_EXPIRY_MINUTES = 30;

  static requestReset(email: string) {
    return Effect.gen(function* () {
      const user = yield* usersQueries.getUserByEmail(email);

      // Create reset token
      const token = yield* Effect.tryPromise({
        try: () => encryptResetToken(user.id, user.email),
        catch: (error) => {
          logError(
            "PasswordResetService.requestReset",
            "Failed to create reset token",
            {
              email,
              error,
            },
          );
          return new PasswordResetError({
            status: false,
            message: "Gagal membuat token reset password.",
          });
        },
      });

      // Calculate expiry date
      const expiresAt = new Date(
        Date.now() + PasswordResetService.RESET_EXPIRY_MINUTES * 60 * 1000,
      );

      // Save reset record
      yield* passwordResetsQueries.createResetRecord(
        user.id,
        token,
        expiresAt.toISOString(),
      );

      const baseUrl = env.APP_URL;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      yield* Effect.tryPromise({
        try: () =>
          emailService.sendPasswordReset(
            user.email,
            resetLink,
            PasswordResetService.RESET_EXPIRY_MINUTES,
          ),
        catch: (error) => {
          logError(
            "PasswordResetService.requestReset",
            "Failed to send password reset email",
            {
              email,
              error,
            },
          );
          return new PasswordResetError({
            status: false,
            message: "Gagal mengirim email reset password.",
          });
        },
      });

      return { status: true, message: "Email reset password telah dikirim." };
    });
  }

  static verifyResetToken(token: string) {
    return Effect.gen(function* () {
      const payload = yield* Effect.tryPromise({
        try: () => decryptResetToken(token),
        catch: (error) => {
          logError(
            "PasswordResetService.verifyResetToken",
            "Failed to decrypt reset token",
            { token, error },
          );
          return new PasswordResetError({
            status: false,
            message: "Token reset password tidak valid atau telah kedaluwarsa.",
          });
        },
      });

      if (!payload) {
        return yield* Effect.fail(
          new PasswordResetError({
            status: false,
            message: "Token reset password tidak valid atau telah kedaluwarsa.",
          }),
        );
      }

      const resetRecord =
        yield* passwordResetsQueries.validateResetToken(token);

      if (!resetRecord) {
        return yield* Effect.fail(
          new PasswordResetError({
            status: false,
            message: "Token reset password tidak valid atau telah kedaluwarsa.",
          }),
        );
      }

      return {
        valid: true,
        userId: payload.userId,
        email: payload.email,
        message: "Token reset password valid.",
      };
    });
  }

  static resetPassword(token: string, newPassword: string) {
    return Effect.gen(this, function* () {
      const verification = yield* this.verifyResetToken(token);

      if (!verification.valid || !verification.userId) {
        return yield* Effect.fail(
          new PasswordResetError({
            status: false,
            message: verification.message,
          }),
        );
      }

      // validate password strength
      if (newPassword.length < 8) {
        return yield* Effect.fail(
          new PasswordResetError({
            status: false,
            message: "Password harus terdiri dari minimal 8 karakter.",
          }),
        );
      }

      yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // Its already hashed in the usersQueries.updateUserPassword
            // Update user's password
            await Effect.runPromise(
              usersQueries.updateUserPassword(
                verification.userId,
                newPassword,
                tx,
              ),
            );

            await Effect.runPromise(
              passwordResetsQueries.markTokenAsUsed(token, tx),
            );

            // Invalidate all other reset tokens for this user
            await Effect.runPromise(
              passwordResetsQueries.invalidateUserResets(
                verification.userId,
                tx,
              ),
            );
          }),
        catch: (error) => {
          logError(
            "PasswordResetService.resetPassword",
            "Failed to reset password",
            {
              token,
              userId: verification.userId,
              error,
            },
          );
          return new PasswordResetError({
            status: false,
            message: "Gagal mereset password.",
          });
        },
      });

      return { status: true, message: "Password berhasil direset." };
    });
  }
}
