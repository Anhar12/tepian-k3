import type { InferInsertModel } from "@tepian-k3/db";
import type { positions } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "./utils.types";

export type InsertPosition = InferInsertModel<typeof positions>;

export type Positions = InferQueryModel<"positions", {}>;
