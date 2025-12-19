import { users } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

const createUserSchema = createInsertSchema(users, {
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .regex(/^\+?[0-9\s\-()]+$/, "Nomor telepon tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
}).pick({
  name: true,
  address: true,
  company: true,
  phone: true,
  email: true,
  password: true,
});

const updateUserSchema = createUpdateSchema(users).pick({
  id: true,
  name: true,
  address: true,
  company: true,
  phone: true,
  password: true,
});

const userSchema = {
  createUserSchema,
  updateUserSchema,
};

export default userSchema;
