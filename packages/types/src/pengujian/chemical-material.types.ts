import { chemicalMaterials } from "@tepian-k3/db/schema";

export type ChemicalMaterial = typeof chemicalMaterials.$inferSelect & {
  pendingStock?: number;
};

export type InsertChemicalMaterial = typeof chemicalMaterials.$inferInsert;
