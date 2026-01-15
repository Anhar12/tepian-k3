import type { InferInsertModel } from "@tepian-k3/db";
import type { employees } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "./utils.types";

export type InsertEmployee = InferInsertModel<typeof employees>;

export type Employees = InferQueryModel<
  "employees",
  {
    with: {
      user: true;
    };
  }
>;
