import { reset } from "drizzle-seed";
import { db } from "../client";
import * as schema from "../schema";
import { exit } from "process";

async function resetDB() {
  await reset(db, {
    ...schema,
  });

  console.log("✅ Database has been reset");
  exit(0);
}

resetDB();
