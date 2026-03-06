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
  email: z.email(),
});

const verifyOtpSchema = z.object({
  email: z.email(),
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

const otpSchema = {
  insertOtpSchema,
  createOtpSchema,
  verifyOtpSchema,
};

export default otpSchema;
