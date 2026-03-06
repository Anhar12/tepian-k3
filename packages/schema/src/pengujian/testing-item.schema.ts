import { testingItem } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const createTestingItemSchema = createInsertSchema(testingItem, {
  parameterId: z.uuidv7(),
  locationId: z.uuidv7(),
  price: z.number().min(0),
  quantity: z.number().min(1),
  result: z.string().max(1000).optional(),
  note: z.string().max(500).optional(),
}).omit({
  subTotal: true,
  testingId: true,
});

const updateTestingItemSchema = createTestingItemSchema
  .extend({
    id: z.uuidv7(),
  })
  .partial();

const testingItemSchema = {
  createTestingItemSchema,
  updateTestingItemSchema,
};

export default testingItemSchema;
