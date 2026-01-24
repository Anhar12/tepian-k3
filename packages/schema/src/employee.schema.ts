import { employees } from "@tepian-k3/db/schema";
import type { Employees } from "@tepian-k3/types/employee.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";

const SORTABLE_EMPLOYEE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof Employees)[];

const getAllEmployeesSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_EMPLOYEE_FIELDS),
        desc: z.boolean(),
      }),
    )
    .default([{ id: "createdAt", desc: false }]),
  name: z.string().default(""),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createEmployeeSchema = createInsertSchema(employees, {
  name: z.string().min(1),
  email: z.email(),
  userId: z.uuidv7(),
  positionId: z.uuidv7(),
});

const updateEmployeeSchema = createUpdateSchema(employees, {
  id: z.uuidv7(),
  name: z.string().min(1),
  email: z.email(),
  userId: z.uuidv7(),
  positionId: z.uuidv7(),
});

const employeeSchemas = {
  getAllEmployeesSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
};

export default employeeSchemas;
