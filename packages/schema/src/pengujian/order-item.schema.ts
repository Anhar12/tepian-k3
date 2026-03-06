import { orderItem } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const createOrderItemSchema = createInsertSchema(orderItem, {
  parameterId: z.uuidv7(),
  locationId: z.uuidv7(),
  price: z.number().min(0),
  quantity: z.number().min(1),
}).omit({
  orderId: true,
  locationId: true,
  subTotal: true,
});

const createOrderItem = z.object({
  id: z.uuidv7(),
  name: z.string(),
  items: z.array(createOrderItemSchema),
});

const orderItemSchema = {
  createOrderItemSchema,
  createOrderItem,
};

export default orderItemSchema;
