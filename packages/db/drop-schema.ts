import postgres from "postgres";
import "dotenv/config";

async function main() {
  const sql = postgres(process.env.POSTGRES_URL as string);
  console.log("Dropping schema...");
  await sql`DROP SCHEMA public CASCADE;`;
  console.log("Creating schema...");
  await sql`CREATE SCHEMA public;`;
  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
