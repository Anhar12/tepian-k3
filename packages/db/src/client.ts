import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "../env";
import * as schema from "./schema";
import * as relations from "./relations";

export const db = drizzle(env.POSTGRES_URL, {
  schema: {
    ...schema,
    ...relations,
  },
});

export type DB = typeof db;

export type DBType = Parameters<Parameters<typeof db.transaction>[0]>[0];
