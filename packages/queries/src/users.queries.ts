import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import { userRoles, users } from "@tepian-k3/db/schema";
import { z } from "zod";
import userSchema from "@tepian-k3/schema/users.schema";
import { hash } from "@node-rs/argon2";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import { storageService } from "@tepian-k3/services/storage";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import userRolesQueries from "./user-roles.queries";

const usersQueries = {
  getUserByEmail(email: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.users.findFirst({
          where: and(eq(users.email, email), isNull(users.deletedAt)),
        }),
      catch: (error) => {
        logger.error("Failed to get user by email", { email, error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pengguna.`,
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((user) =>
        user
          ? Effect.succeed(user)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: `Pengguna tidak ditemukan.`,
              })
            )
      )
    );
  },

  getUserById(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.users.findFirst({
          where: and(eq(users.id, userId), isNull(users.deletedAt)),
          with: {
            roles: true,
          },
          columns: {
            password: false,
          },
        }),
      catch: (error) => {
        console.log(error);
        logger.error("Failed to get user by ID", { userId, error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pengguna.`,
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((user) =>
        user
          ? Effect.succeed({
              ...user,
              profilePictureUrl: user.profilePictureUrl
                ? storageService.getPublicUrl(user.profilePictureUrl)
                : null,
            })
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: `Pengguna tidak ditemukan.`,
              })
            )
      )
    );
  },

  getUserByIdWithPassword(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.users.findFirst({
          where: and(eq(users.id, userId), isNull(users.deletedAt)),
        }),
      catch: (error) => {
        logger.error("Failed to get user by ID with password", {
          userId,
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data pengguna.`,
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((user) =>
        user
          ? Effect.succeed(user)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: `Pengguna tidak ditemukan.`,
              })
            )
      )
    );
  },

  getOffsetPaginatedUsers(input: z.infer<typeof userSchema.getAllUsersSchema>) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: users,
            filters: input.filters as ExtendedColumnFilter<typeof users>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(users.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        users.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        users.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })()
                      )
                    : undefined
                )
              : undefined,
            input.showDeleted
              ? isNotNull(users.deletedAt)
              : isNull(users.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(users[item.id]) : asc(users[item.id])
            )
          : [desc(users.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                address: users.address,
                emailVerified: users.emailVerified,
                emailVerifiedAt: users.emailVerifiedAt,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                deletedAt: users.deletedAt,
              })
              .from(users)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(users)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Failed to get all users", { input, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data pengguna.`,
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

  getOffsetPaginatedDeletedUsers(
    input: z.infer<typeof userSchema.getAllUsersSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: users,
            filters: input.filters as ExtendedColumnFilter<typeof users>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(users.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        users.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        users.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })()
                      )
                    : undefined
                )
              : undefined,
            isNotNull(users.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(users[item.id]) : asc(users[item.id])
            )
          : [desc(users.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                address: users.address,
                emailVerified: users.emailVerified,
                emailVerifiedAt: users.emailVerifiedAt,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                deletedAt: users.deletedAt,
              })
              .from(users)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(users)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Failed to get all users", { input, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data pengguna.`,
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

  createUser(data: z.infer<typeof userSchema.createUserSchema>) {
    return Effect.gen(function* () {
      const isEmailTaken = yield* Effect.tryPromise({
        try: () =>
          db.query.users.findFirst({
            where: and(eq(users.email, data.email), isNull(users.deletedAt)),
          }),
        catch: (error) => {
          logger.error("Failed to check if email is taken", {
            email: data.email,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memeriksa email pengguna.`,
            cause: error,
          });
        },
      });

      if (isEmailTaken) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message: `Email sudah digunakan.`,
          })
        );
      }

      const hashedPassword = yield* Effect.tryPromise({
        try: () => hash(data.password),
        catch: (error) => {
          logger.error("Failed to hash password", {
            email: data.email,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengenkripsi password.`,
            cause: error,
          });
        },
      });

      const user = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const [newUser] = await tx
              .insert(users)
              .values({
                ...data,
                password: hashedPassword,
              })
              .returning();

            if (!newUser) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Gagal membuat pengguna.`,
              });
            }

            // Assign default role to user
            await Effect.runPromise(
              userRolesQueries.assingDefaultRoleToUser(user.id)
            );

            return newUser;
          }),
        catch: (error) => {
          logger.error("Failed to create user", { data, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat pengguna.`,
            cause: error,
          });
        },
      });

      return user;
    });
  },

  adminCreateUser(data: z.infer<typeof userSchema.adminCreateUserSchema>) {
    return Effect.gen(function* () {
      // Check if email is already taken
      const isEmailTaken = yield* Effect.tryPromise({
        try: () =>
          db.query.users.findFirst({
            where: and(eq(users.email, data.email), isNull(users.deletedAt)),
          }),
        catch: (error) => {
          logger.error("Failed to check if email is taken", {
            email: data.email,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memeriksa email pengguna.`,
            cause: error,
          });
        },
      });

      if (isEmailTaken) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message: `Email sudah digunakan.`,
          })
        );
      }

      // Hash the password
      const hashedPassword = yield* Effect.tryPromise({
        try: () => hash(data.password),
        catch: (error) => {
          logger.error("Failed to hash password", {
            email: data.email,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengenkripsi password.`,
            cause: error,
          });
        },
      });

      // Create user in transaction
      const newUser = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const [user] = await tx
              .insert(users)
              .values({
                name: data.name,
                address: data.address,
                email: data.email,
                phone: data.phone,
                emailVerified: data.emailVerified,
                emailVerifiedAt: data.emailVerified
                  ? new Date().toISOString()
                  : data.emailVerifiedAt
                  ? new Date(data.emailVerifiedAt).toISOString()
                  : null,
                password: hashedPassword,
              })
              .returning();

            if (!user) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Gagal membuat pengguna.`,
              });
            }

            data.roleId.forEach(async (roleId) => {
              await Effect.runPromise(
                userRolesQueries.assignRoleToUser(user.id, roleId, tx)
              );
            });

            return user;
          }),
        catch: (error) => {
          logger.error("Failed to create user", { data, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat pengguna.`,
            cause: error,
          });
        },
      });

      return newUser;
    });
  },

  updateUser(
    data: z.infer<typeof userSchema.adminUpdateUserSchema>,
    id: string
  ) {
    return Effect.gen(this, function* () {
      const existingUser = yield* this.getUserByIdWithPassword(id);

      const hashedPassword = data.password
        ? yield* Effect.tryPromise({
            try: () => hash(data.password!),
            catch: (error) => {
              logger.error("Failed to hash password", { id, error });
              return new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Gagal mengenkripsi password.`,
                cause: error,
              });
            },
          })
        : undefined;

      const { emailVerifiedAt, ...restData } = data;

      const user = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // Removed roles
            if (data.deletedRoleIds && data.deletedRoleIds.length > 0) {
              await tx
                .delete(userRoles)
                .where(
                  and(
                    eq(userRoles.userId, id),
                    inArray(userRoles.roleId, data.deletedRoleIds ?? [])
                  )
                );
            }

            // Added roles
            if (data.newRoleIds && data.newRoleIds.length > 0) {
              await tx
                .insert(userRoles)
                .values(
                  data.newRoleIds!.map((roleId) => ({
                    userId: id,
                    roleId,
                  }))
                )
                .onConflictDoNothing();
            }

            const [updatedUser] = await tx
              .update(users)
              .set({
                ...restData,
                emailVerified: data.emailVerified
                  ? data.emailVerified
                  : existingUser.emailVerified,
                password: data.password
                  ? hashedPassword
                  : existingUser.password,
                emailVerifiedAt: emailVerifiedAt
                  ? emailVerifiedAt.toISOString()
                  : existingUser.emailVerifiedAt,
              })
              .where(eq(users.id, id))
              .returning();

            if (!updatedUser) {
              tx.rollback();
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Gagal memperbarui data pengguna.`,
              });
            }

            return updatedUser;
          }),
        catch: (error) => {
          logger.error("Failed to update user", { id, data, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui data pengguna.`,
            cause: error,
          });
        },
      });

      return user;
    });
  },

  updateUserProfile(
    id: string,
    data: z.infer<typeof userSchema.updateUserSchema>
  ) {
    return Effect.gen(this, function* () {
      yield* this.getUserById(id);

      const [user] = yield* Effect.tryPromise({
        try: () =>
          db.update(users).set(data).where(eq(users.id, id)).returning(),
        catch: (error) => {
          logger.error("Failed to update user profile", { id, data, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui profil pengguna.`,
            cause: error,
          });
        },
      });

      if (!user) {
        logger.error("No user returned after profile update", { id });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui profil pengguna.`,
          })
        );
      }

      return user;
    });
  },

  updateUserAvatar(id: string, filename: string, url: string) {
    return Effect.gen(this, function* () {
      const user = yield* this.getUserById(id);

      const [updatedUser] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(users)
            .set({
              profilePictureFileName: filename,
              profilePictureUrl: url,
            })
            .where(eq(users.id, id))
            .returning(),
        catch: (error) => {
          logger.error("Failed to update user profile", { id, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui profil pengguna.`,
            cause: error,
          });
        },
      });

      if (!updatedUser) {
        logger.error("No user returned after profile update", { id });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui profil pengguna.`,
          })
        );
      }

      // this should remove previous profile picture from storage if user had one
      if (user.profilePictureFileName && user.profilePictureUrl) {
        yield* storageService.delete(`avatars/${user.profilePictureFileName}`);
      }

      return updatedUser;
    });
  },

  updateUserPassword(userId: string, newPassword: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      yield* this.getUserById(userId);

      const hashedPassword = yield* Effect.tryPromise({
        try: () => hash(newPassword),
        catch: (error) => {
          logger.error("Failed to hash new password", { userId, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengenkripsi password baru.`,
            cause: error,
          });
        },
      });

      const [user] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(users)
            .set({
              password: hashedPassword,
            })
            .where(eq(users.id, userId))
            .returning(),
        catch: (error) => {
          logger.error("Failed to update user password", { userId, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui password pengguna.`,
            cause: error,
          });
        },
      });

      if (!user) {
        logger.error("No user returned after password update", { userId });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui password pengguna.`,
          })
        );
      }

      return user;
    });
  },

  markUserEmailAsVerified(userId: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      yield* this.getUserById(userId);

      const [user] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(users)
            .set({
              emailVerified: true,
              emailVerifiedAt: new Date().toISOString(),
            })
            .where(eq(users.id, userId))
            .returning(),
        catch: (error) => {
          logger.error("Failed to mark user email as verified", {
            userId,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui status verifikasi email pengguna.`,
            cause: error,
          });
        },
      });

      if (!user) {
        logger.error("No user returned after marking email as verified", {
          userId,
        });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui status verifikasi email pengguna.`,
          })
        );
      }

      return Effect.succeed(user);
    });
  },

  deleteUser(userId: string) {
    return Effect.gen(this, function* () {
      yield* this.getUserById(userId);

      const [user] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(users)
            .set({
              deletedAt: new Date().toISOString(),
            })
            .where(eq(users.id, userId))
            .returning(),
        catch: (error) => {
          logger.error("Failed to delete user", { userId, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal menghapus pengguna.`,
            cause: error,
          });
        },
      });

      if (!user) {
        logger.error("No user returned after deletion", { userId });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal menghapus pengguna.`,
          })
        );
      }

      return Effect.succeed(user);
    });
  },

  restoreUser(userId: string) {
    return Effect.gen(this, function* () {
      const isExistDeletedUser = yield* Effect.tryPromise({
        try: () =>
          db.query.users.findFirst({
            where: and(eq(users.id, userId), isNotNull(users.deletedAt)),
          }),
        catch: (error) => {
          logger.error("Failed to check if deleted user exists", {
            userId,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memeriksa data pengguna.`,
            cause: error,
          });
        },
      });

      if (!isExistDeletedUser) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Pengguna tidak ditemukan.`,
          })
        );
      }

      const [user] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(users)
            .set({
              deletedAt: null,
            })
            .where(eq(users.id, userId))
            .returning(),
        catch: (error) => {
          logger.error("Failed to restore user", { userId, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengembalikan pengguna.`,
            cause: error,
          });
        },
      });

      if (!user) {
        logger.error("No user returned after restoration", { userId });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengembalikan pengguna.`,
          })
        );
      }

      return user;
    });
  },
};

export default usersQueries;
