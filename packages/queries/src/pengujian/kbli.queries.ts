import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import { kblis } from "@tepian-k3/db/schema";
import { z } from "zod";
import districSchema from "@tepian-k3/schema/pengujian/kbli.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const kbliQueries = {
  getAllKblis() {
    return Effect.tryPromise({
      try: () =>
        db.query.kblis.findMany({
          where: isNull(kblis.deletedAt),
        }),
      catch: (error) => {
        logError("kbliQueries.getAllKblis", "Error fetching all kblis", {
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kbli",
        });
      },
    });
  },

  getKbliById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.kblis.findFirst({
          where: and(eq(kblis.id, id), isNull(kblis.deletedAt)),
        }),
      catch: (error) => {
        logError("kbliQueries.getKbliById", "Error fetching kbli by ID", {
          id,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kbli berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((kbli) =>
        kbli ? Effect.succeed(kbli) : Effect.succeed(null),
      ),
    );
  },

  getDeletedKbliById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.kblis.findFirst({
          where: and((eq(kblis.id, id), isNotNull(kblis.deletedAt))),
        }),
      catch: (error) => {
        logError(
          "kbliQueries.getDeletedKbliById",
          "Error fetching deleted kbli by ID",
          {
            id,
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kbli yang dihapus berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((kbli) =>
        kbli ? Effect.succeed(kbli) : Effect.succeed(null),
      ),
    );
  },

  getKbliByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.kblis.findFirst({
          where: eq(kblis.name, name),
        }),
      catch: (error) => {
        logError("kbliQueries.getKbliByName", "Error fetching kbli by name", {
          name,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kbli berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((kbli) =>
        kbli ? Effect.succeed(kbli) : Effect.succeed(null),
      ),
    );
  },

  getOffsetPaginatedKblis(
    input: z.infer<typeof districSchema.getAllKBLISchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: kblis,
            filters: input.filters as ExtendedColumnFilter<typeof kblis>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(kblis.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        kblis.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        kblis.createdAt,
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
              ? isNotNull(kblis.deletedAt)
              : isNull(kblis.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(kblis[item.id]) : asc(kblis[item.id]),
            )
          : [desc(kblis.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(kblis)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(kblis)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "kbliQueries.getOffsetPaginatedKblis",
            "Error fetching paginated kblis",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data kbli`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    });
  },

  createKbli(data: z.infer<typeof districSchema.createKBLISchema>) {
    return Effect.gen(this, function* () {
      const isExisting = yield* kbliQueries.getKbliByName(data.name);

      if (isExisting) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "KBLI dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
        });
      }

      const [kbli] = yield* Effect.tryPromise({
        try: () => db.insert(kblis).values(data).returning().execute(),
        catch: (error) => {
          logError("kbliQueries.createKbli", "Error creating kbli", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data kbli",
          });
        },
      });

      if (!kbli) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data kbli",
        });
      }

      return kbli;
    });
  },

  updateKbli(data: z.infer<typeof districSchema.updateKBLISchema>) {
    return Effect.gen(this, function* () {
      const existingKbli = yield* kbliQueries.getKbliById(data.id);

      if (!existingKbli) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KBLI tidak ditemukan.",
        });
      }

      const [updatedKbli] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(kblis)
            .set(data)
            .where(eq(kblis.id, data.id))
            .returning()
            .execute(),
        catch: (error) => {
          logError("kbliQueries.updateKbli", "Error updating kbli", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data kbli",
          });
        },
      });

      if (!updatedKbli) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui data kbli",
        });
      }

      return updatedKbli;
    });
  },

  deleteKbli(id: string) {
    return Effect.gen(this, function* () {
      const existingKbli = yield* kbliQueries.getKbliById(id);

      if (!existingKbli) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KBLI tidak ditemukan.",
        });
      }

      const [deletedKbli] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(kblis)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(kblis.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logError("kbliQueries.deleteKbli", "Error deleting kbli", {
            error,
            id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data kbli",
          });
        },
      });

      if (!deletedKbli) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data kbli",
        });
      }

      return deletedKbli;
    });
  },

  restoreKbli(id: string) {
    return Effect.gen(this, function* () {
      const deletedKbli = yield* kbliQueries.getDeletedKbliById(id);

      if (!deletedKbli) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KBLI yang dihapus tidak ditemukan.",
        });
      }

      const [restoredKbli] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(kblis)
            .set({ deletedAt: null })
            .where(eq(kblis.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logError("kbliQueries.restoreKbli", "Error restoring kbli", {
            error,
            id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data kbli",
          });
        },
      });

      if (!restoredKbli) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan data daerah",
        });
      }

      return restoredKbli;
    });
  },

  hardDeleteKbli(id: string) {
    return Effect.tryPromise({
      try: () => db.delete(kblis).where(eq(kblis.id, id)).returning(),
      catch: (error) => {
        logError("kbliQueries.hardDeleteKbli", "Error hard deleting kbli", {
          error,
          id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen data kbli",
        });
      },
    });
  },
};

export default kbliQueries;
