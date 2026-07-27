import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as baseSchema from "@tepian-k3/db/schema";
import * as relations from "../../../../../packages/db/src/relations";
import path from "path";
import fs from "fs";

// Singleton instance
let sharedDbInstance: { db: any; client: PGlite } | null = null;

/**
 * Creates a fresh, isolated instance of PGlite with migrations applied.
 * This is useful for tests that strictly need absolute isolation.
 * For general usage, prefer `getSharedTestDb` to avoid timeout issues.
 * 
 * @returns {Promise<{ db: any; client: PGlite }>} Returns an object containing the Drizzle DB instance and the underlying PGlite client.
 */
export async function createIsolatedTestDb() {
  const client = new PGlite();
  
  const schema = { ...baseSchema, ...relations };
  // Using casing: "snake_case" because the real app uses it.
  const db = drizzle(client, { schema, casing: "snake_case" });
  
  // Custom migration logic to ignore duplicate enum label errors
  const migrationsFolder = path.resolve(__dirname, "../../../../../packages/db/src/migrations");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
  
  for (const entry of journal.entries) {
    const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    const statements = sqlContent.split("--> statement-breakpoint");
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      try {
        await client.exec(trimmed);
      } catch (e: any) {
        if (e.code === "42710" || e.code === "42701") {
          // duplicate_object (enum already exists) or duplicate_column (column already exists)
          continue;
        }
        throw e;
      }
    }
  }
  
  // Disable foreign key checks and triggers for tests
  await client.exec("SET session_replication_role = replica;");

  return { db, client };
}

/**
 * Gets or initializes the singleton test DB instance.
 * Reuses the same PGlite instance across test files (when run sequentially).
 * 
 * @returns {Promise<any>} The Drizzle ORM database instance configured with PGlite.
 */
export async function getSharedTestDb() {
  if (!sharedDbInstance) {
    sharedDbInstance = await createIsolatedTestDb();
  }
  return sharedDbInstance.db;
}

/**
 * Retrieves the shared test database synchronously.
 * Throws an error if `getSharedTestDb` has not been called previously.
 * 
 * @throws {Error} If the shared DB instance is not initialized.
 * @returns {any} The Drizzle ORM database instance.
 */
export function getSharedTestDbSync() {
  if (!sharedDbInstance) {
    throw new Error("Test DB has not been initialized. Call getSharedTestDb() first.");
  }
  return sharedDbInstance.db;
}

/**
 * Cleanup helper for the isolated DB.
 * Closes the underlying PGlite connection to prevent memory leaks.
 * 
 * @param {PGlite} client - The PGlite client instance to close.
 * @returns {Promise<void>}
 */
export async function cleanupTestDb(client: PGlite) {
  await client.close();
}

/**
 * Truncates all tables in the given DB to ensure a clean state between test runs.
 * Note: Views and enums are not truncated. This should be run `beforeEach` in tests.
 * 
 * @param {any} db - The Drizzle ORM database instance.
 * @returns {Promise<void>}
 */
export async function truncateAllTables(db: any) {
  const query = `
    DO $$ 
    DECLARE 
      r RECORD;
    BEGIN 
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'drizzle.__drizzle_migrations') LOOP 
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE;'; 
      END LOOP; 
    END $$;
  `;
  await db.execute(query);
}

