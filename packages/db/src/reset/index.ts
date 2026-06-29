import { reset } from "drizzle-seed";
import { db } from "../client";
import * as schema from "../schema";
import { exit } from "process";

async function resetDB() {
  // ==================
  // PRODUCTION GUARD
  // ==================
  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ GAGAL: Perintah ini DILARANG dijalankan di lingkungan PRODUCTION!",
    );
    console.error(
      "   Perintah ini akan menghapus SELURUH data. Hanya boleh dijalankan di lokal / staging.",
    );
    process.exit(1);
  }

  await reset(db, {
    ...schema,
  });

  console.log("✅ Database has been reset");
  exit(0);
}

resetDB();
