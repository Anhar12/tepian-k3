import { parameterChemicalMaterials } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "../utils.types";

export type ParameterChemicals = InferQueryModel<
  "parameterChemicalMaterials",
  {
    with: {
      parameter: {
        columns: {
          id: true;
          name: true;
        };
      };
      chemicalMaterial: true;
    };
  }
>;

export type InsertParameterChemical =
  typeof parameterChemicalMaterials.$inferInsert;
