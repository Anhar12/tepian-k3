import { relations } from "drizzle-orm";
import { userCompanies, users } from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  userCompanies: many(userCompanies),
}));
