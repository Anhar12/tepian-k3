import { hash } from "@node-rs/argon2";
import { db } from "../client";
import {
  permission,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "../schema";
import { exit } from "process";
import { eq } from "drizzle-orm";
import seedClusters from "./clusters";
import seedParameterCategories from "./parameter-categories";
import seedProvinces from "./provinces";
import seedRegencies from "./regencies";
import seedDistricts from "./districts";
import seedVillages from "./villages";
import seedKblis from "./kblis";
import seedParameters from "./parameter";
import seedEmployees from "./employee";
import {
  generatePermissionsList,
  generateRolesList,
  ROLE_PERMISSIONS,
  type Role,
} from "@tepian-k3/constants";

async function seed() {
  console.log("🌱 Starting database seeding...");

  // Generate all permissions using type-safe utility
  // This generates 165 permissions (33 resources × 5 actions)
  // Each resource has: view, create, read, update, delete
  const permissionsList = generatePermissionsList();

  // Create or get all permissions
  console.log("📋 Syncing permissions...");
  const existingPerms = await db.query.permission.findMany();
  const existingPermNames = new Set(existingPerms.map((p) => p.name));

  const newPermissions = permissionsList.filter(
    (p) => !existingPermNames.has(p.name)
  );

  let allPerms = [...existingPerms];

  if (newPermissions.length > 0) {
    console.log(`   ➕ Adding ${newPermissions.length} new permissions...`);
    const insertedPerms = await db
      .insert(permission)
      .values(newPermissions)
      .returning();
    allPerms = [...allPerms, ...insertedPerms];
  }

  console.log(`✅ ${allPerms.length} permissions in database`);

  // Create or get roles using type-safe role definitions
  console.log("👥 Syncing roles...");

  const rolesList = generateRolesList();
  const existingRoles = await db.query.roles.findMany();
  const existingRoleNames = new Set(existingRoles.map((r) => r.name));

  const newRoles = rolesList.filter((r) => !existingRoleNames.has(r.name));

  let allRoles = [...existingRoles];

  if (newRoles.length > 0) {
    console.log(`   ➕ Adding ${newRoles.length} new roles...`);
    const insertedRoles = await db
      .insert(roles)
      .values(newRoles)
      .returning();
    allRoles = [...allRoles, ...insertedRoles];
  }

  console.log(`✅ ${allRoles.length} roles in database`);

  // Create a map for easy role lookup
  const roleMap = new Map(allRoles.map((r) => [r.name as Role, r]));

  // Sync permissions to roles using type-safe definitions
  console.log("🔐 Syncing permissions to roles...");

  // Get existing role permissions
  const existingRolePerms = await db.query.rolePermissions.findMany();
  const existingRolePermSet = new Set(
    existingRolePerms.map((rp) => `${rp.roleId}-${rp.permissionId}`)
  );

  // Create a permission name to ID map for easy lookup
  const permissionMap = new Map(allPerms.map((p) => [p.name, p.id]));

  const rolePermissionsToAdd = [];

  // Assign permissions to each role based on ROLE_PERMISSIONS
  for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleMap.get(roleName as Role);
    if (!role) {
      console.warn(`⚠️  Role '${roleName}' not found in database, skipping...`);
      continue;
    }

    for (const permissionName of permissionNames) {
      const permissionId = permissionMap.get(permissionName);
      if (!permissionId) {
        console.warn(`⚠️  Permission '${permissionName}' not found for role '${roleName}', skipping...`);
        continue;
      }

      const key = `${role.id}-${permissionId}`;
      if (!existingRolePermSet.has(key)) {
        rolePermissionsToAdd.push({
          roleId: role.id,
          permissionId: permissionId,
        });
      }
    }
  }

  if (rolePermissionsToAdd.length > 0) {
    console.log(
      `   ➕ Adding ${rolePermissionsToAdd.length} role-permission assignments...`
    );
    await db.insert(rolePermissions).values(rolePermissionsToAdd);
  }

  console.log("✅ Role permissions synced");

  const password = await hash("test12345");

  // Create example users (only if they don't exist)
  console.log("👤 Syncing example users...");

  const existingSuperAdminUser = await db.query.users.findFirst({
    where: eq(users.email, "superadmin@mail.com"),
  });

  const existingAdminUser = await db.query.users.findFirst({
    where: eq(users.email, "admin@mail.com"),
  });

  const existingRegularUser = await db.query.users.findFirst({
    where: eq(users.email, "user@mail.com"),
  });

  const superAdminUser =
    existingSuperAdminUser ||
    (
      await db
        .insert(users)
        .values({
          email: "superadmin@mail.com",
          password,
          address: "Jl. Test Address No.123",
          name: "superadmin",
          phone: "081234567890",
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        })
        .returning()
    )[0];

  const adminUser =
    existingAdminUser ||
    (
      await db
        .insert(users)
        .values({
          email: "admin@mail.com",
          password,
          address: "Jl. Test Address No.123",
          name: "admin",
          phone: "081234567890",
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        })
        .returning()
    )[0];

  const regularUser =
    existingRegularUser ||
    (
      await db
        .insert(users)
        .values({
          email: "user@mail.com",
          password,
          address: "Jl. Test Address No.123",
          name: "user",
          phone: "081234567890",
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        })
        .returning()
    )[0];

  if (!superAdminUser || !adminUser || !regularUser) {
    throw new Error("Failed to create or retrieve example users");
  }

  console.log("✅ Users synced");

  // Assign roles to users (idempotent)
  console.log("🔗 Syncing user roles...");

  const superAdminRole = roleMap.get("super_admin");
  const adminRole = roleMap.get("admin");
  const userRole = roleMap.get("user");

  if (!superAdminRole || !adminRole || !userRole) {
    throw new Error("Required roles not found in database");
  }

  await db
    .insert(userRoles)
    .values([
      { userId: superAdminUser.id, roleId: superAdminRole.id },
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: regularUser.id, roleId: userRole.id },
    ])
    .onConflictDoNothing();

  // seeding other data can go here...
  await seedClusters();
  await seedParameterCategories();
  await seedParameters();
  await seedProvinces();
  await seedRegencies();
  await seedDistricts();
  await seedVillages();
  await seedKblis();
  await seedEmployees();

  console.log("✅ User roles synced");
  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📝 Default credentials:");
  console.log("   Super Admin: superadmin@mail.com / test12345");
  console.log("   Admin:       admin@mail.com / test12345");
  console.log("   User:        user@mail.com / test12345\n");

  exit(0);
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  exit(1);
});
