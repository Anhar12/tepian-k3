import { testing } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type Testing = typeof testing.$inferSelect;

export type TestingWithRelations = InferQueryModel<
  "testing",
  {
    with: {
      order: {
        columns: {
          id: true;
          orderNumber: true;
        };
      };
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
      type: {
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
