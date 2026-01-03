import { cart } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

const createCartSchema = createInsertSchema(cart, {
  companyId: z.uuidv7(),
  locationId: z.uuidv7(),
  parameterId: z.uuidv7(),
  quantity: z.number().min(1),
  price: z.number().min(0),
}).omit({
  userId: true,
});

const updateCartSchema = createUpdateSchema(cart, {
  id: z.uuidv7(),
  companyId: z.optional(z.uuidv7()),
  locationId: z.optional(z.uuidv7()),
  parameterId: z.optional(z.uuidv7()),
  quantity: z.optional(z.number().min(1)),
  price: z.optional(z.number().min(0)),
}).omit({
  userId: true,
});

const cartSchema = {
  createCartSchema,
  updateCartSchema,
};

export default cartSchema;
