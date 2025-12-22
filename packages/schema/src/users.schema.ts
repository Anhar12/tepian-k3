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
    }
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
  createUserSchema,
  updateUserSchema,
  updateUserProfileSchema,
  updateUserPasswordSchema,
};

export default userSchema;
