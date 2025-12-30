import { userCompanies } from "@tepian-k3/db/schema";

export type UserCompany = typeof userCompanies.$inferSelect;

export type InsertUserCompany = typeof userCompanies.$inferInsert;
