import { otpCodes } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const insertOtpSchema = createInsertSchema(otpCodes).pick({
  userId: true,
  code: true,
  email: true,
  expiresAt: true,
  attempts: true,
  verified: true,
});

const createOtpSchema = z.object({
  email: z.email("Format email tidak valid"),
});

const verifyOtpSchema = z.object({
  email: z.email("Format email tidak valid"),
  code: z
    .string()
    .length(6, "OTP harus terdiri dari 6 digit")
    .regex(/^\d+$/, "OTP hanya boleh berisi angka"),
});

const otpSchema = {
  insertOtpSchema,
  createOtpSchema,
  verifyOtpSchema,
};

export default otpSchema;
