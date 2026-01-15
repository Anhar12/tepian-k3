import employeeSchema from "@tepian-k3/schema/employee.schema";
import { createTRPCRouter, withPermission } from "..";
import employeeQueries from "@tepian-k3/queries/employee.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { EMPLOYEE_STATUS } from "@tepian-k3/constants";

export const employeeRouter = createTRPCRouter({
  getEmployeePaginated: withPermission("employees.read")
    .input(employeeSchema.getAllEmployeesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        employeeQueries.getOffsetPaginatedEmployees(input)
      );

      return { data, pageCount };
    }),

  getEmployeeDetails: withPermission("employees.read")
    .input(
      z.object({
        employeeId: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await runEffect(employeeQueries.getEmployeeById(input.employeeId))
    ),

  createEmployee: withPermission("employees.create")
    .input(employeeSchema.createEmployeeSchema)
    .mutation(async ({ input }) => {
      const newEmployee = await runEffect(
        employeeQueries.createEmployee(input)
      );

      return newEmployee;
    }),

  updateEmployee: withPermission("employees.update")
    .input(employeeSchema.updateEmployeeSchema)
    .mutation(async ({ input }) => {
      const updatedEmployee = await runEffect(
        employeeQueries.updateEmployee(input)
      );

      return updatedEmployee;
    }),

  updateEmployeeStatus: withPermission("employees.update")
    .input(
      z.object({
        employeeId: z.uuidv7(),
        status: z.enum(EMPLOYEE_STATUS),
      })
    )
    .mutation(async ({ input }) => {
      const updatedEmployee = await runEffect(
        employeeQueries.updateEmployeeStatus(input.employeeId, input.status)
      );

      return updatedEmployee;
    }),

  deleteEmployee: withPermission("employees.delete")
    .input(
      z.object({
        employeeId: z.uuidv7(),
      })
    )
    .mutation(async ({ input }) => {
      const [deletedEmployee] = await runEffect(
        employeeQueries.deleteEmployee(input.employeeId)
      );

      if (!deletedEmployee) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus karyawan",
        });
      }

      return deletedEmployee;
    }),

  restoreEmployee: withPermission("employees.delete")
    .input(
      z.object({
        employeeId: z.uuidv7(),
      })
    )
    .mutation(async ({ input }) => {
      const [restoredEmployee] = await runEffect(
        employeeQueries.restoreEmployee(input.employeeId)
      );

      if (!restoredEmployee) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan karyawan",
        });
      }

      return restoredEmployee;
    }),
});
