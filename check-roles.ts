import { db } from "./packages/db/src/client";
import { roles } from "./packages/db/src/schema";

async function main() {
  try {
    const allRoles = await db.select().from(roles);
    console.log("--- ROLES IN DATABASE ---");
    console.log(allRoles);
    console.log("-------------------------");
  } catch (error) {
    console.error("Database connection or query failed:", error);
  }
  process.exit(0);
}

main();
