import { TRPCError } from "@tepian-k3/utils/error";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import { employees, positions, users } from "@tepian-k3/db/schema";
import { z } from "zod";
import employeeSchema from "@tepian-k3/schema/employee.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import usersQueries from "./users.queries";
import type { EmployeeStatus } from "@tepian-k3/constants";

const employeeQueries = {
  getAllEmployees: () =>
    Effect.tryPromise({
      try: () =>
        db.query.employees.findMany({
          where: isNull(employees.deletedAt),
          with: {
            position: true,
            user: true,
          },
        }),
      catch: (error) => {
        logError(
          "employeeQueries.getAllEmployees",
          "Failed to get all employees",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pegawai.`,
          cause: error,
        });
      },
    }),

  getEmployeeById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employees.findFirst({
          where: and(eq(employees.id, id), isNull(employees.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "employeeQueries.getEmployeeById",
          "Failed to get employee by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pegawai.`,
          cause: error,
        });
      },
    }),

  getEmployeeByUserId: (userId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employees.findFirst({
          where: and(eq(employees.userId, userId), isNull(employees.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "employeeQueries.getEmployeeByUserId",
          "Failed to get employee by user ID",
          { userId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pegawai.`,
          cause: error,
        });
      },
    }),

  getDeletedEmployeeById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employees.findFirst({
          where: and(eq(employees.id, id), isNotNull(employees.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "employeeQueries.getDeletedEmployeeById",
          "Failed to get deleted employee by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pegawai yang dihapus.`,
          cause: error,
        });
      },
    }),

  getDeletedEmployeeByUserId: (userId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employees.findFirst({
          where: and(
            eq(employees.userId, userId),
            isNotNull(employees.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "employeeQueries.getDeletedEmployeeByUserId",
          "Failed to get deleted employee by user ID",
          { userId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pegawai yang dihapus.`,
          cause: error,
        });
      },
    }),

  getOffsetPaginatedEmployees: (
    input: z.infer<typeof employeeSchema.getAllEmployeesSchema>,
  ) =>
    Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: employees,
            filters: input.filters as ExtendedColumnFilter<typeof employees>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(employees.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        employees.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        employees.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                )
              : undefined,
            input.showDeleted
              ? isNotNull(employees.deletedAt)
              : isNull(employees.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(employees[item.id]) : asc(employees[item.id]),
            )
          : [desc(employees.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select({
                ...getTableColumns(employees),
                position: {
                  ...getTableColumns(positions),
                },
                user: {
                  ...getTableColumns(users),
                },
              })
              .from(employees)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .leftJoin(positions, eq(employees.positionId, positions.id))
              .leftJoin(users, eq(employees.userId, users.id))
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(employees)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "employeeQueries.getOffsetPaginatedEmployees",
            "Failed to get all employees",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data pegawai.`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    }),

  createEmployee: (
    input: z.infer<typeof employeeSchema.createEmployeeSchema>,
  ) =>
    Effect.gen(function* () {
      const isUserExist = yield* usersQueries.getUserById(input.userId);

      const [employee] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(employees)
            .values({
              name: input.name,
              positionId: input.positionId,
              userId: input.userId,
              email: isUserExist.email,
              nip: input.nip,
              type: input.type,
            })
            .returning(),
        catch: (error) => {
          logError(
            "employeeQueries.createEmployee",
            "Failed to create employee",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat data pegawai.`,
            cause: error,
          });
        },
      });

      if (!employee) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat data pegawai.`,
          }),
        );
      }

      return employee;
    }),

  updateEmployee: (
    input: z.infer<typeof employeeSchema.updateEmployeeSchema>,
  ) =>
    Effect.gen(function* () {
      const isEmployeeExist = yield* employeeQueries.getEmployeeById(input.id);

      if (!isEmployeeExist) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Pegawai tidak ditemukan.`,
          }),
        );
      }

      const isUserExist = yield* usersQueries.getUserById(input.userId);

      const [employee] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(employees)
            .set({
              name: input.name,
              positionId: input.positionId,
              userId: input.userId,
              email: isUserExist.email,
            })
            .where(eq(employees.id, input.id))
            .returning(),
        catch: (error) => {
          logError(
            "employeeQueries.updateEmployee",
            "Failed to update employee",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui data pegawai.`,
            cause: error,
          });
        },
      });

      if (!employee) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui data pegawai.`,
          }),
        );
      }

      return employee;
    }),

  updateEmployeeStatus: (employeeId: string, status: EmployeeStatus) =>
    Effect.gen(function* () {
      const isEmployeeExist =
        yield* employeeQueries.getEmployeeById(employeeId);

      if (!isEmployeeExist) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Pegawai tidak ditemukan.`,
          }),
        );
      }

      const [employee] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(employees)
            .set({
              status: status,
            })
            .where(eq(employees.id, employeeId))
            .returning(),
        catch: (error) => {
          logError(
            "employeeQueries.updateEmployeeStatus",
            "Failed to update employee status",
            { employeeId, status, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui status pegawai.`,
            cause: error,
          });
        },
      });

      if (!employee) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui status pegawai.`,
          }),
        );
      }

      return employee;
    }),

  deleteEmployee: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db
          .update(employees)
          .set({
            deletedAt: new Date().toISOString(),
          })
          .where(eq(employees.id, id))
          .returning(),
      catch: (error) => {
        logError(
          "employeeQueries.deleteEmployee",
          "Failed to delete employee",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menghapus data pegawai.`,
          cause: error,
        });
      },
    }),

  restoreEmployee: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db
          .update(employees)
          .set({
            deletedAt: null,
          })
          .where(eq(employees.id, id))
          .returning(),
      catch: (error) => {
        logError(
          "employeeQueries.restoreEmployee",
          "Failed to restore employee",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengembalikan data pegawai.`,
          cause: error,
        });
      },
    }),
};

export default employeeQueries;
