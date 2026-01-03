import { testing } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

const createTestingSchema = createInsertSchema(testing, {
  companyId: z.uuidv7(),
  testingType: z.uuidv7(),
}).omit({
  testingNumber: true,
  orderId: true,
  orderNumber: true,
  userId: true,
  note: true,
});

const testingSchema = {
  createTestingSchema,
};

export default testingSchema;
