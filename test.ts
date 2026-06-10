import { db } from "./packages/db/src/client";
import { pelatihan } from "./packages/db/src/schema/pelatihan";
import { and, isNull, desc } from "drizzle-orm";

async function run() {
  try {
    const data = await db.query.pelatihan.findMany({
      where: and(isNull(pelatihan.deletedAt)),
      limit: 20,
      offset: 0,
      orderBy: [desc(pelatihan.createdAt)],
    });
    console.log("Success, count:", data.length);
  } catch (error) {
    console.error("DB Error:", error);
  }
}

run();
