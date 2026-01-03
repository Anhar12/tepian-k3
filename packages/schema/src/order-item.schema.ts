import { orderItem } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const createOrderItemSchema = createInsertSchema(orderItem, {
  parameterId: z.uuidv7(),
  locationId: z.uuidv7(),
  price: z.number().min(0),
  quantity: z.number().min(1),
}).omit({
  subTotal: true,
});

const orderItemSchema = {
  createOrderItemSchema,
};

export default orderItemSchema;
