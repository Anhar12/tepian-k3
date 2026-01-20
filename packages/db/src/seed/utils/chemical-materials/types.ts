import z from "zod";
import { BAHAN_UNITS, BAHAN_STATUS } from "@tepian-k3/constants";

const ChemicalMaterialSchema = z.object({
  code: z.string(),
  catalogNumber: z.string().nullable().optional(),
  chemicalFormula: z.string().nullable().optional(),
  name: z.string(),
  usedStock: z.number().optional(),
  usedStockUnit: z.enum(BAHAN_UNITS).optional(),
  sealedStock: z.number().optional(),
  sealedStockUnit: z.enum(BAHAN_UNITS).optional(),
  monthlyUsage: z.number().optional(),
  monthlyUsageUnit: z.enum(BAHAN_UNITS).optional(),
  remainingUsedMaterial: z.number().optional(),
  remainingUsedMaterialUnit: z.enum(BAHAN_UNITS).optional(),
  incomingMaterialNote: z.string().optional(),
  expiredDate: z.string().optional(),
  status: z.enum(BAHAN_STATUS),
  parameters: z.array(z.string()),
});

const ChemicalMaterialsSchema = z.array(ChemicalMaterialSchema);

export type ChemicalMaterial = z.infer<typeof ChemicalMaterialSchema>;
export type ChemicalMaterials = z.infer<typeof ChemicalMaterialsSchema>;
