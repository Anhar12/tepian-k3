import postgres from "postgres";
import "dotenv/config";

async function main() {
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

  const sql = postgres(process.env.POSTGRES_URL as string);
  console.log("Dropping schema...");
  await sql`DROP SCHEMA public CASCADE;`;
  console.log("Creating schema...");
  await sql`CREATE SCHEMA public;`;
  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
