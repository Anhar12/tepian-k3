import { parameters } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type PaginatedParameters = InferQueryModel<
  "parameters",
  {
    with: {
      category: {
        columns: { id: true; name: true };
      };
    };
  }
>;

export type Parameters = InferQueryModel<
  "parameters",
  {
    with: {
      category: true;
    };
  }
>;

export type InsertParameter = typeof parameters.$inferInsert;
