import { tools } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "../utils.types";

export type Tools = InferQueryModel<
  "tools",
  {
    with: {
      toolCode: true;
    };
  }
>;

export type InsertTool = typeof tools.$inferInsert;
