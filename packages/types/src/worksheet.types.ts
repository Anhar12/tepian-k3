import type { InferInsertModel } from "@tepian-k3/db";
import type { worksheets } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "./utils.types";

export type WorksheetCard = InferQueryModel<
  "worksheets",
  {
    with: {
      testing: {
        columns: {
          id: true;
          testingNumber: true;
          companyId: true;
        };
        with: {
          company: {
            columns: {
              id: true;
              name: true;
              address: true;
              responsibleTestingPerson: true;
              responsibleTestingPersonEmail: true;
              responsibleTestingPersonPhone: true;
              companyPictureUrl: true;
              provinceId: true;
              districtId: true;
              regencyId: true;
              villageId: true;
            };
            with: {
              province: {
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
          };
        };
      };
    };
  }
>;

export type WorksheetSidebar = InferQueryModel<
  "worksheets",
  {
    with: {
      testing: {
        columns: {
          id: true;
          testingNumber: true;
          companyId: true;
        };
        with: {
          company: {
            columns: {
              id: true;
              name: true;
              address: true;
              responsibleTestingPerson: true;
              responsibleTestingPersonEmail: true;
              responsibleTestingPersonPhone: true;
              companyPictureUrl: true;
              provinceId: true;
              districtId: true;
              regencyId: true;
              villageId: true;
            };
            with: {
              province: {
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
          };
        };
      };
    };
  }
>;

export type CreateWorksheet = InferInsertModel<typeof worksheets>;
