import { parameterChemicalMaterials } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

const createParameterChemicalMaterialSchema = createInsertSchema(
  parameterChemicalMaterials,
  {
    parameterId: z.uuidv7(),
    chemicalMaterialId: z.uuidv7(),
  },
);

const updateParameterChemicalMaterialSchema = createUpdateSchema(
  parameterChemicalMaterials,
  {
    id: z.uuidv7(),
    parameterId: z.uuidv7(),
    chemicalMaterialId: z.uuidv7(),
  },
);

const parameterChemicalMaterialSchema = {
  createParameterChemicalMaterialSchema,
  updateParameterChemicalMaterialSchema,
};

export default parameterChemicalMaterialSchema;
