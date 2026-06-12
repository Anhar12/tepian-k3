import { Effect } from "effect";
import { db } from "@tepian-k3/db/client";
import { users } from "@tepian-k3/db/schema";
import { eq, sql } from "@tepian-k3/db";
import usersQueries from "@tepian-k3/queries/platform/users.queries";

async function main() {
  console.log("Starting soft-delete email collision test...");
  const email = `test-deleted-${Date.now()}@example.com`;

  try {
    // 1. Create first user
    console.log(`Creating first user with email: ${email}`);
    const user1 = await Effect.runPromise(
      usersQueries.createUser({
        name: "Test User 1",
        address: "Address 1",
        email: email,
        phone: "081234567890",
        password: "Password123!",
      }),
    );
    console.log("First user created with ID:", user1.id);

    // 2. Soft delete the first user
    console.log("Soft deleting the first user...");
    await db
      .update(users)
      .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, user1.id));
    console.log("First user soft-deleted.");

    // 3. Attempt to create second user with the same email
    console.log(
      `Attempting to create second user with the same email: ${email}`,
    );
    const user2 = await Effect.runPromise(
      usersQueries.createUser({
        name: "Test User 2",
        address: "Address 2",
        email: email,
        phone: "089876543210",
        password: "Password456!",
      }),
    );
    console.log("Second user created successfully with ID:", user2.id);
  } catch (error: any) {
    console.error("FAILED during collision test!");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error(
      "Full Error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    );
  }
}

main().then(() => process.exit(0));
