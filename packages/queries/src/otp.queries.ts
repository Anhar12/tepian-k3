import { and, eq, gt, gte } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { otpCodes } from "@tepian-k3/db/schema";
import type z from "zod";
import otpSchema from "@tepian-k3/schema/otp.schema";
import { TRPCError } from "@trpc/server";

const otpQueries = {
  async invalidateOTPsByEmail(email: string) {
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(and(eq(otpCodes.email, email), eq(otpCodes.verified, false)));
  },

  async createOTP(data: z.infer<typeof otpSchema.insertOtpSchema>) {
    const [result] = await db.insert(otpCodes).values(data).returning();

    if (!result)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Gagal membuat kode OTP.",
      });

    return result;
  },

  async findValidOTP(email: string) {
    const res = await db.query.otpCodes.findFirst({
      where: and(
        eq(otpCodes.email, email),
        eq(otpCodes.verified, false),
        gte(otpCodes.expiresAt, new Date().toISOString())
      ),
    });

    return res;
  },

  async findLastOTPByEmail(email: string) {
    const res = await db.query.otpCodes.findFirst({
      where: eq(otpCodes.email, email),
      orderBy: (otpCodes, { desc }) => [desc(otpCodes.createdAt)],
    });

    return res;
  },

  async incrementOTPAttempts(id: string, currentAttempt: number) {
    const [result] = await db
      .update(otpCodes)
      .set({ attempts: currentAttempt + 1 })
      .where(eq(otpCodes.id, id))
      .returning();

    if (!result)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Gagal memperbarui percobaan kode OTP.",
      });

    return result;
  },

  async markOTPAsVerified(id: string) {
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, id));
  },

  async deleteExpiredOTPs() {
    await db
      .delete(otpCodes)
      .where(gt(otpCodes.expiresAt, new Date().toISOString()));
  },
};

export default otpQueries;
