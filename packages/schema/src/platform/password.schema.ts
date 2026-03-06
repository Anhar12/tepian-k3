import { z } from "zod";

/**
 * Strong password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
  .regex(
    /[^A-Za-z0-9]/,
    "Password harus mengandung minimal 1 karakter khusus (!@#$%^&*)",
  );

/**
 * Basic password validation (legacy - for backward compatibility)
 * Only enforces minimum length
 */
export const basicPasswordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter");

/**
 * Password confirmation schema
 * Use with .refine() to validate password confirmation matches
 */
export const passwordConfirmationSchema = z
  .object({
    password: strongPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi password tidak sesuai",
    path: ["passwordConfirmation"],
  });

export default {
  strongPasswordSchema,
  basicPasswordSchema,
  passwordConfirmationSchema,
};
