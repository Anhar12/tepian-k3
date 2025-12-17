import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { eq } from "@tepian-k3/db/index";
import { users } from "@tepian-k3/db/schema";
import { z } from "zod";
import userSchema from "@tepian-k3/schema/users.schema";
import { hash } from "@node-rs/argon2";

const usersQueries = {
  async getUserByEmail(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Pengguna dengan email tersebut tidak ditemukan.`,
      });
    }

    return user;
  },

  async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Pengguna tidak ditemukan.`,
      });
    }

    return user;
  },

  async createUser(data: z.infer<typeof userSchema.createUserSchema>) {
    const isEmailTaken = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (isEmailTaken) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Username sudah digunakan.`,
      });
    }

    const [user] = await db
      .insert(users)
      .values({
        ...data,
        password: await hash(data.password),
      })
      .returning();

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Gagal membuat pengguna baru.`,
      });
    }

    return user;
  },

  async markUserEmailAsVerified(userId: string) {
    await this.getUserById(userId);

    const [user] = await db
      .update(users)
      .set({ emailVerified: true, emailVerifiedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Gagal memverifikasi email pengguna.`,
      });
    }
    return user;
  },
};

export default usersQueries;
