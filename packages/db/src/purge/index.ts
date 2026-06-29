import { sql } from "drizzle-orm";
import { db } from "../client";
import { exit } from "process";

async function purgeDB() {
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

  console.log("⚠️  Dropping entire public schema...");

  // Drop public schema (all tables, enums, sequences) and the drizzle
  // migration journal schema so drizzle-kit re-runs all migrations from scratch.
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);

  console.log("✅ Database purged — run db:migrate to recreate the schema");
  exit(0);
}

purgeDB();
