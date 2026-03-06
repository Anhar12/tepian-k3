import type { InferInsertModel } from "@tepian-k3/db";
import type { worksheetAssignments } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "../utils.types";

export type WorksheetAssignmentDetail = InferQueryModel<
  "worksheetAssignments",
  {
    with: {
      employee: {
        with: {
          user: true;
          position: true;
        };
      };
    };
  }
>;

export type CreateWorksheetAssignmentInput = InferInsertModel<
  typeof worksheetAssignments
>;
