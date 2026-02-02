import { roles } from "@tepian-k3/db/schema";
import type { Roles } from "@tepian-k3/types/roles.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

const SORTABLE_ROLE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof Roles)[];

const getAllRolesSchema = createPaginationSchema(SORTABLE_ROLE_FIELDS).extend({
  name: z.string().default(""),
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
