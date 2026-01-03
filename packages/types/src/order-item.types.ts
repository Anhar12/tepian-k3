import { orderItem } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type OrderItem = typeof orderItem.$inferSelect;

export type OrderItemWithRelations = InferQueryModel<
  "orderItem",
  {
    with: {
      parameter: {
        columns: {
          id: true;
          name: true;
        };
      };
      order: {
        columns: {
          id: true;
          orderNumber: true;
        };
      };
      location: {
        columns: {
          id: true;
          name: true;
        };
      };
    };
  }
>;

export type InsertOrderItem = typeof orderItem.$inferInsert;
