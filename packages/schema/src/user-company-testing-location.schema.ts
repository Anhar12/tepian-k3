import { userCompanyTestingLocation } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_USER_COMPANY_TESTING_LOCATION_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof userCompanyTestingLocation.$inferSelect)[];

const getAllUserCompanyTestingLocationSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_USER_COMPANY_TESTING_LOCATION_FIELDS),
        desc: z.boolean(),
      })
    )
    .default([{ id: "createdAt", desc: false }]),
  name: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createUserCompanyTestingLocationSchema = createInsertSchema(
  userCompanyTestingLocation,
  {
    userCompanyId: z.uuidv7(),
    name: z.string().min(1).max(256),
    districtId: z.uuidv7(),
    regencyId: z.uuidv7(),
  }
);

const updateUserCompanyTestingLocationSchema = createUpdateSchema(
  userCompanyTestingLocation,
  {
    id: z.uuidv7(),
    userCompanyId: z.optional(z.uuidv7()),
    name: z.optional(z.string().min(1).max(256)),
    districtId: z.optional(z.uuidv7()),
    regencyId: z.optional(z.uuidv7()),
  }
);

const userCompanyTestingLocationSchema = {
  getAllUserCompanyTestingLocationSchema,
  createUserCompanyTestingLocationSchema,
  updateUserCompanyTestingLocationSchema,
};

export default userCompanyTestingLocationSchema;
