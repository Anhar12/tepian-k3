import { testingItem } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type TestingItem = typeof testingItem.$inferSelect;

export type TestingWithRelations = InferQueryModel<
  "testingItem",
  {
    with: {
      parameter: {
        columns: {
          id: true;
          name: true;
        };
      };
    };
  }
>;

export type InsertTestingItem = typeof testingItem.$inferInsert;
