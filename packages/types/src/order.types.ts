import { order } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type Order = typeof order.$inferSelect;

export type OrderWithRelations = InferQueryModel<
  "order",
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
      testing: true;
      items: true;
      statusHistory: true;
    };
  }
>;

export type InsertTesting = typeof order.$inferInsert;
