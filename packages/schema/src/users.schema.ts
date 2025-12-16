import { users } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";

const createUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

const updateUserSchema = createInsertSchema(users).pick({
  id: true,
  username: true,
  password: true,
});

const userSchema = {
  createUserSchema,
  updateUserSchema,
};

export default userSchema;
