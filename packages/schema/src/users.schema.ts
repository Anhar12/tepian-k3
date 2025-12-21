import { users } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { zfd } from "zod-form-data";

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
  phone: true,
  email: true,
  password: true,
});

const updateUserSchema = createUpdateSchema(users).pick({
  id: true,
  name: true,
  address: true,
  phone: true,
  password: true,
});

const updateUserProfileSchema = zfd.formData({
  avatar: zfd.file().refine((file) => file.size > 0, {
    message: "Avatar file is required",
  }),
});

const userSchema = {
  createUserSchema,
  updateUserSchema,
  updateUserProfileSchema,
};

export default userSchema;
