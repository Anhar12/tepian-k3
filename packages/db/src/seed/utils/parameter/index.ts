import { readJsonFile } from "../indonesian-countries/utils";
import type { Parameters } from "./types";

async function getParameters() {
  const provinces = await readJsonFile<Parameters>(
    "data/parameter.json",
    undefined,
    "src/seed/utils/parameter/"
  );

  return provinces;
}

export { getParameters };
