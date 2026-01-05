import { parameterTools } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

const createParameterToolSchema = createInsertSchema(parameterTools, {
  parameterId: z.uuidv7(),
  toolId: z.uuidv7(),
});

const updateParameterToolSchema = createUpdateSchema(parameterTools, {
  id: z.uuidv7(),
  parameterId: z.uuidv7(),
  toolId: z.uuidv7(),
});

const parameterToolSchema = {
  createParameterToolSchema,
  updateParameterToolSchema,
};

export default parameterToolSchema;
