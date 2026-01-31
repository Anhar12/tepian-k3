import { userCompanyTestingLocation } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_USER_COMPANY_TESTING_LOCATION_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof userCompanyTestingLocation.$inferSelect)[];

const getAllUserCompanyTestingLocationSchema = createPaginationSchema(
  SORTABLE_USER_COMPANY_TESTING_LOCATION_FIELDS,
).extend({
  name: z.string().default(""),
});

const createUserCompanyTestingLocationSchema = createInsertSchema(
  userCompanyTestingLocation,
  {
    userCompanyId: z.uuidv7(),
    name: z.string().min(1).max(256),
    districtId: z.uuidv7(),
    regencyId: z.uuidv7(),
  },
).omit({
  userId: true,
});

const updateUserCompanyTestingLocationSchema = createUpdateSchema(
  userCompanyTestingLocation,
  {
    id: z.uuidv7(),
    userCompanyId: z.optional(z.uuidv7()),
    name: z.optional(z.string().min(1).max(256)),
    districtId: z.optional(z.uuidv7()),
    regencyId: z.optional(z.uuidv7()),
  },
).omit({
  userId: true,
});

const userCompanyTestingLocationSchema = {
  getAllUserCompanyTestingLocationSchema,
  createUserCompanyTestingLocationSchema,
  updateUserCompanyTestingLocationSchema,
};

export default userCompanyTestingLocationSchema;
