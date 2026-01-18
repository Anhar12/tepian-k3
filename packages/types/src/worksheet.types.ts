import type { InferInsertModel } from "@tepian-k3/db";
import type { worksheets } from "@tepian-k3/db/schema";

import type { InferQueryModel } from "./utils.types";

/**
 * Full worksheet detail type with all relations
 * Matches the return type of worksheetQueries.getWorksheetById
 */
export type WorksheetDetail = InferQueryModel<
  "worksheets",
  {
    with: {
      testing: {
        with: {
          order: {
            with: {
              company: true;
            };
          };
          items: {
            with: {
              parameter: {
                with: {
                  category: {
                    with: {
                      cluster: true;
                    };
                  };
                };
              };
              location: true;
            };
          };
        };
      };
      items: {
        with: {
          parameter: {
            with: {
              category: {
                with: {
                  cluster: true;
                };
              };
            };
          };
          location: true;
        };
      };
      tools: {
        with: {
          tool: true;
        };
      };
      assignments: {
        with: {
          employee: {
            with: {
              user: true;
            };
          };
        };
      };
      notes: {
        with: {
          createdBy: true;
        };
      };
      mainSupervisor: {
        with: {
          user: true;
        };
      };
      accompanyingSupervisor: {
        with: {
          user: true;
        };
      };
      createdBy: true;
    };
  }
>;

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
