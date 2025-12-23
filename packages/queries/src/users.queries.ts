import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { and, eq, isNull } from "@tepian-k3/db/index";
import { users } from "@tepian-k3/db/schema";
import { z } from "zod";
import userSchema from "@tepian-k3/schema/users.schema";
import { hash } from "@node-rs/argon2";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import { storageService } from "@tepian-k3/services/storage";

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
          columns: {
            password: false,
          },
        }),
      catch: (error) => {
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

      const [user] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(users)
            .values({
              ...data,
              password: hashedPassword,
            })
            .returning(),
        catch: (error) => {
          logger.error("Failed to create user", { data, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat pengguna.`,
            cause: error,
          });
        },
      });

      if (!user) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat pengguna.`,
          })
        );
      }

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

      // this should remove previous profile picture from storage if user had one
      if (user.profilePictureFileName && user.profilePictureUrl) {
        yield* storageService.delete(`avatars/${user.profilePictureFileName}`);
      }

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

      return updatedUser;
    });
  },

  updateUserPassword(userId: string, newPassword: string) {
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
          db
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

  markUserEmailAsVerified(userId: string) {
    return Effect.gen(this, function* () {
      yield* this.getUserById(userId);

      const [user] = yield* Effect.tryPromise({
        try: () =>
          db
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
};

export default usersQueries;
