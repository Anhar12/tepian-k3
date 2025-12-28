import { roles } from "@tepian-k3/db/schema";
import type { Roles } from "@tepian-k3/types/roles.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

const SORTABLE_ROLE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof Roles)[];

const getAllRolesSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_ROLE_FIELDS),
        desc: z.boolean(),
      })
    )
    .default([{ id: "createdAt", desc: true }]),
  name: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createRoleSchema = createInsertSchema(roles, {
  name: z.string().min(1),
  description: z.optional(z.string().min(1)),
}).pick({
  name: true,
  description: true,
});

const updateRoleSchema = createUpdateSchema(roles, {
  id: z.uuidv7(),
  name: z.string().min(1),
  description: z.optional(z.string().min(1)),
}).pick({
  id: true,
  name: true,
  description: true,
});

const rolesSchema = {
  getAllRolesSchema,
  createRoleSchema,
  updateRoleSchema,
};

export default rolesSchema;
