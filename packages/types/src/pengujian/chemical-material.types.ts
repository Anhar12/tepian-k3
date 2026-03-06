import { chemicalMaterials } from "@tepian-k3/db/schema";

export type ChemicalMaterial = typeof chemicalMaterials.$inferSelect;

export type InsertChemicalMaterial = typeof chemicalMaterials.$inferInsert;
