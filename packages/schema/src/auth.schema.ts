import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Gunakan format email yang valid"),
  password: z.string().min(8, "Password harus terdiri dari minimal 8 karakter"),
});

const authSchema = {
  loginSchema,
};

export default authSchema;
