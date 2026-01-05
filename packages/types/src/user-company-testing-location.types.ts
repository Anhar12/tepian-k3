import { userCompanyTestingLocation } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type UserCompanyTestingLocation = InferQueryModel<
  "userCompanyTestingLocation",
  {
    with: {
      regency: {
        columns: {
          id: true;
          name: true;
        };
      };
      district: {
        columns: {
          id: true;
          name: true;
        };
      };
      userCompany: {
        columns: {
          id: true;
          name: true;
        };
      };
    };
  }
>;

export type InsertUserCompanyTestingLocation =
  typeof userCompanyTestingLocation.$inferInsert;
