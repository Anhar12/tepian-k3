import { userCompanies } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { createPaginationSchema } from "./pagination.schema";

export const SORTABLE_USER_COMPANY_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof userCompanies.$inferSelect)[];

const getAllUserCompaniesSchema = createPaginationSchema(
  SORTABLE_USER_COMPANY_FIELDS,
).extend({
  name: z.string().default(""),
});

const createUserCompanySchema = createInsertSchema(userCompanies, {
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
  wlkp: z.string().regex(/^\d+$/).max(10).optional(),
  responsibleTestingPerson: z.string().min(1).max(256),
  responsibleTestingPersonEmail: z.email().max(256),
  responsibleTestingPersonPhone: z.string().min(1).max(20),
})
  .omit({
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    userId: true,
    companyPictureUrl: true,
  })
  .extend({
    picture: z.file().max(2 * 1024 * 1024),
  });

const updateUserCompanySchema = createUpdateSchema(userCompanies, {
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
})
  .omit({
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    userId: true,

    companyPictureUrl: true,
  })
  .extend({
    picture: z.optional(z.file().max(2 * 1024 * 1024)),
  });

const userCompanySchema = {
  getAllUserCompaniesSchema,
  createUserCompanySchema,
  updateUserCompanySchema,
};

export default userCompanySchema;
