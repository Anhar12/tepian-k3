import { userCompanies } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "../utils.types";

export type UserCompany = typeof userCompanies.$inferSelect;

export type UserCompaniesWithRelations = InferQueryModel<
  "userCompanies",
  {
    with: {
      district: {
        columns: {
          id: true;
          name: true;
        };
      };
      kbli: {
        columns: {
          id: true;
          name: true;
        };
      };
      province: {
        columns: {
          id: true;
          name: true;
        };
      };
      regency: {
        columns: {
          id: true;
          name: true;
        };
      };
      village: {
        columns: {
          id: true;
          name: true;
        };
      };
    };
  }
>;

export type InsertUserCompany = typeof userCompanies.$inferInsert;
