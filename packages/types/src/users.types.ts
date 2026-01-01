import type { InferInsertModel } from "@tepian-k3/db";
import type { users } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "./utils.types";
import type { Roles } from "./roles.types";

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

export type UserWithPermissions = Omit<Users, "password"> & {
  roles: Roles[];
  permissions: string[];
};

export type InsertUser = InferInsertModel<typeof users>;
