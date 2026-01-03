import { testing } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type Testing = typeof testing.$inferSelect;

export type TestingWithRelations = InferQueryModel<
  "testing",
  {
    with: {
      user: {
        columns: {
          id: true;
          name: true;
        };
      };
      company: {
        columns: {
          id: true;
          name: true;
        };
      };
      location: {
        columns: {
          id: true;
          name: true;
        };
      };
      items: true;
    };
  }
>;

export type InsertTesting = typeof testing.$inferInsert;
