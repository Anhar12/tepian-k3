import { chemicalMaterials } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { filterSchema } from "./filter.schema";
import { BAHAN_STATUS, BAHAN_UNITS } from "@tepian-k3/constants";

export const SORTABLE_CHEMICAL_MATERIAL_FIELDS = [
  "name",
  "code",
  "status",
  "usedStock",
  "sealedStock",
  "expiredDate",
  "createdAt",
  "updatedAt",
  "deletedAt",
] as const satisfies readonly (keyof typeof chemicalMaterials.$inferSelect)[];

const getAllChemicalMaterialsSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  sort: z
    .array(
      z.object({
        id: z.enum(SORTABLE_CHEMICAL_MATERIAL_FIELDS),
        desc: z.boolean(),
      })
    )
    .default([{ id: "createdAt", desc: false }]),
  name: z.string().default(""),
  code: z.string().default(""),
  status: z.enum(BAHAN_STATUS).optional(),
  createdAt: z.array(z.coerce.number()).default([]),
  filters: z.array(filterSchema).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  showDeleted: z.boolean().default(false),
});

const createChemicalMaterialSchema = createInsertSchema(chemicalMaterials, {
  code: z.string().min(1, "Kode bahan kimia wajib diisi").max(100),
  name: z.string().min(1, "Nama bahan kimia wajib diisi").max(256),
  catalogNumber: z.string().max(100).optional().nullable(),
  chemicalFormula: z.string().max(100).optional().nullable(),
  usedStock: z.number().min(0).optional(),
  usedStockUnit: z.enum(BAHAN_UNITS).optional().nullable(),
  sealedStock: z.number().min(0).optional(),
  sealedStockUnit: z.enum(BAHAN_UNITS).optional().nullable(),
  monthlyUsage: z.number().min(0).optional().nullable(),
  monthlyUsageUnit: z.enum(BAHAN_UNITS).optional().nullable(),
  remainingUsedMaterial: z.number().min(0).optional().nullable(),
  remainingUsedMaterialUnit: z.enum(BAHAN_UNITS).optional().nullable(),
  incomingMaterialNote: z.string().optional().nullable(),
  expiredDate: z.string().optional().nullable(),
  status: z.enum(BAHAN_STATUS),
});

const updateChemicalMaterialSchema = createUpdateSchema(chemicalMaterials, {
  id: z.string().uuid(),
});

const getChemicalMaterialsByParameterIdsSchema = z.object({
  parameterIds: z.array(z.string().uuid()),
});

const getChemicalMaterialsForWorksheetSchema = z.object({
  worksheetId: z.string().uuid(),
});

const chemicalMaterialSchema = {
  getAllChemicalMaterialsSchema,
  createChemicalMaterialSchema,
  updateChemicalMaterialSchema,
  getChemicalMaterialsByParameterIdsSchema,
  getChemicalMaterialsForWorksheetSchema,
};

export default chemicalMaterialSchema;
