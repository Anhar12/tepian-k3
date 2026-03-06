import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Gunakan format email yang valid"),
  password: z.string().min(8, "Password harus terdiri dari minimal 8 karakter"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token diperlukan"),
});

const revokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

const authSchema = {
  loginSchema,
  refreshTokenSchema,
  revokeSessionSchema,
};

export default authSchema;
