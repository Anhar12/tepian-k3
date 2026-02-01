import { users } from "@tepian-k3/db/schema";
import type { UsersWithoutFoto } from "@tepian-k3/types/users.types";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { zfd } from "zod-form-data";
import { filterSchema } from "./filter.schema";
import { createPaginationSchema } from "./pagination.schema";

const SORTABLE_USER_FIELDS = [
  "name",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof UsersWithoutFoto)[];

const getAllUsersSchema = createPaginationSchema(SORTABLE_USER_FIELDS).extend({
  name: z.string().default(""),
});

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

const adminCreateUserSchema = createInsertSchema(users, {
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .regex(/^\+?[0-9\s\-()]+$/, "Nomor telepon tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  email: z.email(),
  emailVerified: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
})
  .pick({
    name: true,
    address: true,
    phone: true,
    email: true,
    password: true,
    emailVerified: true,
    emailVerifiedAt: true,
  })
  .extend({
    roleId: z.array(z.uuidv7("Role ID harus berupa UUID v7")),
  });

const adminUpdateUserSchema = createUpdateSchema(users, {
  id: z.uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .regex(/^\+?[0-9\s\-()]+$/, "Nomor telepon tidak valid"),
  email: z.email(),
  emailVerified: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
  password: z.optional(z.string().min(6, "Password minimal 6 karakter")),
})
  .pick({
    id: true,
    name: true,
    address: true,
    phone: true,
    email: true,
    emailVerified: true,
    emailVerifiedAt: true,
    password: true,
  })
  .extend({
    deletedRoleIds: z.array(z.uuidv7()).optional(),
    newRoleIds: z.array(z.uuidv7()).optional(),
  });

const updateUserSchema = createUpdateSchema(users, {
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .regex(/^\+?[0-9\s\-()]+$/, "Nomor telepon tidak valid"),
}).pick({
  name: true,
  address: true,
  phone: true,
});

const updateUserProfileSchema = zfd.formData({
  avatar: zfd.file().refine(
    (file) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 2 * 1024 * 1024; // 2MB
      return isValidType && isValidSize;
    },
    {
      message:
        "File harus berupa gambar (JPEG, PNG) dan berukuran maksimal 2MB",
    },
  ),
});

const updateUserPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    newPasswordConfirm: z.string().min(6, "Password minimal 6 karakter"),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Konfirmasi password tidak sesuai",
    path: ["newPasswordConfirm"],
  });

const userSchema = {
  getAllUsersSchema,
  createUserSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  updateUserSchema,
  updateUserProfileSchema,
  updateUserPasswordSchema,
};

export default userSchema;
