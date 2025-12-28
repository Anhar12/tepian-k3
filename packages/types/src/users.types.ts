import type { InferInsertModel } from "@tepian-k3/db/index";
import type { users } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "./utils.types";

export type Users = InferQueryModel<
  "users",
  {
    columns: {
      password: false;
    };
  }
>;

export type UsersWithoutFoto = InferQueryModel<
  "users",
  {
    columns: {
      profilePictureFileName: false;
      profilePictureUrl: false;
      password: false;
    };
  }
>;

export type InsertUser = InferInsertModel<typeof users>;
