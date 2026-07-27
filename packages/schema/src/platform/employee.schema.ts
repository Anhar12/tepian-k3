import { employees } from "@tepian-k3/db/schema";
import type { Employees } from "@tepian-k3/types/platform/employee.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "./pagination.schema";

const SORTABLE_EMPLOYEE_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof Employees)[];

const getAllEmployeesSchema = createPaginationSchema(
  SORTABLE_EMPLOYEE_FIELDS,
).extend({
  name: z.string().default(""),
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

const getAvailableEmployeesSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const employeeSchemas = {
  getAllEmployeesSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  getAvailableEmployeesSchema,
};

export default employeeSchemas;
