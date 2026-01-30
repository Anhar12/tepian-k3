import { readJsonFile } from "../indonesian-countries/utils";
import type { ChemicalMaterials } from "./types";

async function getChemicalMaterials() {
  const chemicalMaterials = await readJsonFile<ChemicalMaterials>(
    "data/chemical-materials.json",
    undefined,
    "src/seed/utils/chemical-materials/",
  );

  return chemicalMaterials;
}

export { getChemicalMaterials };
