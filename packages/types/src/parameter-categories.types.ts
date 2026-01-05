import { parameterCategories } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type ParameterCategories = InferQueryModel<
  "parameterCategories",
  {
    with: {
      cluster: {
        columns: {
          id: true;
          name: true;
        };
      };
    };
  }
>;

export type InsertParameterCategory = typeof parameterCategories.$inferInsert;
