import { parameterTools } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "../utils.types";

export type ParameterTools = InferQueryModel<
  "parameterTools",
  {
    with: {
      parameter: {
        columns: {
          id: true;
          name: true;
        };
      };
      tool: {
        columns: {
          id: true;
          toolName: true;
        };
        with: {
          toolCode: true;
        };
      };
    };
  }
>;

export type InsertParameterTool = typeof parameterTools.$inferInsert;
