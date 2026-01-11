import { order } from "@tepian-k3/db/schema";
import type { InferQueryModel } from "./utils.types";

export type Order = typeof order.$inferSelect;

export type OrderWithHistory = InferQueryModel<
  "order",
  {
    with: {
      statusHistory: true;
      items: {
        with: {
          parameter: {
            columns: {
              id: true;
              name: true;
            };
            with: {
              category: {
                columns: {
                  id: true;
                  name: true;
                };
                with: {
                  cluster: {
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
      };
    };
  }
>;

export type OrderWithCompanyAndItems = InferQueryModel<
  "order",
  {
    with: {
      company: {
        columns: {
          id: true;
          name: true;
          address: true;
          responsibleTestingPersonPhone: true;
        };
        with: {
          regency: {
            columns: {
              id: true;
              name: true;
            };
          };
        };
      };
      statusHistory: true;
      items: {
        with: {
          parameter: {
            columns: {
              id: true;
              name: true;
              unit: true;
            };
            with: {
              category: {
                columns: {
                  id: true;
                  name: true;
                };
                with: {
                  cluster: {
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
      };
    };
  }
>;

export type OrderWithRelations = InferQueryModel<
  "order",
  {
    with: {
      user: {
        columns: {
          id: true;
          name: true;
        };
      };
      company: {
        columns: {
          id: true;
          name: true;
        };
      };
      testing: true;
      items: true;
      statusHistory: true;
    };
  }
>;

export type InsertTesting = typeof order.$inferInsert;
