import { userCompanies } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

const createUserCompanySchema = createInsertSchema(userCompanies, {
  companyName: z.string().min(1),
  companyAddress: z.string().min(1),
}).pick({
  companyName: true,
  companyAddress: true,
});

const updateUserCompanySchema = createUpdateSchema(userCompanies).pick({
  id: true,
  companyName: true,
  companyAddress: true,
});

const userCompaniesSchema = {
  createUserCompanySchema,
  updateUserCompanySchema,
};

export default userCompaniesSchema;
