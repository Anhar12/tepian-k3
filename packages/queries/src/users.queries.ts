import { TRPCError } from "@trpc/server";
import { type DBType, db } from "@tepian-k3/db/client";
import { eq } from "@tepian-k3/db/index";
import { users } from "@tepian-k3/db/schema";
import { z } from "zod";
import userSchema from "@tepian-k3/schema/users.schema";
import { hash } from "@node-rs/argon2";

const usersQueries = {
  async getUserByUsername(username: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Pengguna dengan username ${username} tidak ditemukan.`,
      });
    }

    return user;
  },

  async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Pengguna dengan ID ${userId} tidak ditemukan.`,
      });
    }
  },

  async createUser(data: z.infer<typeof userSchema.createUserSchema>) {
    const isUsernameTaken = await this.getUserByUsername(data.username);

    if (isUsernameTaken) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Username ${data.username} sudah digunakan.`,
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
};

export default usersQueries;
