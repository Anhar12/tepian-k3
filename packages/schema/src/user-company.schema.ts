import { userCompanies } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

export const SORTABLE_USER_COMPANY_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof userCompanies.$inferSelect)[];

const getAllUserCompaniesSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_USER_COMPANY_FIELDS),
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

const createUserCompanySchema = createInsertSchema(userCompanies, {
  userId: z.uuidv7(),
  kbliId: z.uuidv7(),
  provinceId: z.uuidv7(),
  districtId: z.uuidv7(),
  regencyId: z.uuidv7(),
  villageId: z.uuidv7(),
  name: z.string().min(1).max(256),
  address: z.string().min(1).max(512),
  email: z.email().max(256),
  femaleWorkers: z.string().regex(/^\d+$/).max(10),
  maleWorkers: z.string().regex(/^\d+$/).max(10),
  healthFacilityAvailable: z.boolean(),
  wlkpStatus: z.boolean(),
  wlkp: z.string().regex(/^\d+$/).max(10),
  responsibleTestingPerson: z.string().min(1).max(256),
  responsibleTestingPersonEmail: z.email().max(256),
  responsibleTestingPersonPhone: z.string().min(1).max(20),
});

const updateUserCompanySchema = createUpdateSchema(userCompanies, {
  userId: z.optional(z.uuidv7()),
  id: z.uuidv7(),
  kbliId: z.optional(z.uuidv7()),
  provinceId: z.optional(z.uuidv7()),
  districtId: z.optional(z.uuidv7()),
  regencyId: z.optional(z.uuidv7()),
  villageId: z.optional(z.uuidv7()),
  name: z.optional(z.string().min(1).max(256)),
  address: z.optional(z.string().min(1).max(512)),
  email: z.optional(z.email().max(256)),
  femaleWorkers: z.optional(z.string().regex(/^\d+$/).max(10)),
  maleWorkers: z.optional(z.string().regex(/^\d+$/).max(10)),
  healthFacilityAvailable: z.optional(z.boolean()),
  wlkpStatus: z.optional(z.boolean()),
  wlkp: z.optional(z.string().regex(/^\d+$/).max(10)),
  responsibleTestingPerson: z.optional(z.string().min(1).max(256)),
  responsibleTestingPersonEmail: z.optional(z.email().max(256)),
  responsibleTestingPersonPhone: z.optional(z.string().min(1).max(20)),
});

const userCompanySchema = {
  getAllUserCompaniesSchema,
  createUserCompanySchema,
  updateUserCompanySchema,
};

export default userCompanySchema;
