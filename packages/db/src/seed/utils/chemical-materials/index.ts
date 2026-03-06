import { readJsonFile } from "../indonesian-countries/utils";
import type { ChemicalMaterials } from "./types";

async function getChemicalMaterials() {
  const chemicalMaterials = await readJsonFile<ChemicalMaterials>(
    "data/chemical-materials.json",
    "src/seed/utils/chemical-materials/",
  );

  return chemicalMaterials;
}

export { getChemicalMaterials };
