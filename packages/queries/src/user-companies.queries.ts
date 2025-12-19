import { and, eq, isNull } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { userCompanies } from "@tepian-k3/db/schema";
import { TRPCError } from "@trpc/server";
import userCompaniesSchema from "@tepian-k3/schema/user-companies.schema";
import type z from "zod";

const userCompaniesQueries = {
  async getAllUserCompanies() {
    const companies = await db.query.userCompanies.findMany({
      where: isNull(userCompanies.deletedAt),
    });

    return companies;
  },

  async getDetailUserCompany(companyId: string) {
    const company = await db.query.userCompanies.findFirst({
      where: and(
        eq(userCompanies.id, companyId),
        isNull(userCompanies.deletedAt)
      ),
    });

    if (!company) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Perusahaan tidak ditemukan.`,
      });
    }

    return company;
  },

  async getAllUserCompanyByUserId(userId: string) {
    const company = await db.query.userCompanies.findMany({
      where: and(
        eq(userCompanies.userId, userId),
        isNull(userCompanies.deletedAt)
      ),
    });

    return company;
  },

  async createUserCompany(
    userId: string,
    data: z.infer<typeof userCompaniesSchema.createUserCompanySchema>
  ) {
    const [company] = await db
      .insert(userCompanies)
      .values({
        ...data,
        userId,
      })
      .returning();

    if (!company) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Gagal membuat perusahaan.`,
      });
    }

    return company;
  },

  async updateUserCompany(
    companyId: string,
    userId: string,
    data: z.infer<typeof userCompaniesSchema.updateUserCompanySchema>
  ) {
    const existingCompany = await db.query.userCompanies.findFirst({
      where: and(
        eq(userCompanies.id, companyId),
        isNull(userCompanies.deletedAt)
      ),
    });

    if (!existingCompany) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Perusahaan tidak ditemukan.`,
      });
    }

    if (existingCompany.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Anda tidak memiliki izin untuk memperbarui perusahaan ini.`,
      });
    }

    const [updatedCompany] = await db
      .update(userCompanies)
      .set(data)
      .where(eq(userCompanies.id, companyId))
      .returning();

    if (!updatedCompany) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Gagal memperbarui perusahaan.`,
      });
    }

    return updatedCompany;
  },

  async deleteUserCompany(companyId: string, userId: string) {
    const existingCompany = await db.query.userCompanies.findFirst({
      where: and(
        eq(userCompanies.id, companyId),
        isNull(userCompanies.deletedAt)
      ),
    });

    if (!existingCompany) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Perusahaan tidak ditemukan.`,
      });
    }
    if (existingCompany.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Anda tidak memiliki izin untuk menghapus perusahaan ini.`,
      });
    }

    const [deletedCompany] = await db
      .update(userCompanies)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(userCompanies.id, companyId))
      .returning();

    if (!deletedCompany) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Gagal menghapus perusahaan.`,
      });
    }

    return deletedCompany;
  },
};

export default userCompaniesQueries;
