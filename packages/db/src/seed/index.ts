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

async function seed() {
  console.log("🌱 Starting database seeding...");

  // Define all permissions
  const permissionsList = [
    { name: "users.create", resource: "users", action: "create" },
    { name: "users.read", resource: "users", action: "read" },
    { name: "users.update", resource: "users", action: "update" },
    { name: "users.delete", resource: "users", action: "delete" },
    { name: "users.manage", resource: "users", action: "manage" },
    { name: "roles.create", resource: "roles", action: "create" },
    { name: "roles.read", resource: "roles", action: "read" },
    { name: "roles.update", resource: "roles", action: "update" },
    { name: "roles.delete", resource: "roles", action: "delete" },
    { name: "roles.manage", resource: "roles", action: "manage" },
    { name: "permissions.create", resource: "permissions", action: "create" },
    { name: "permissions.read", resource: "permissions", action: "read" },
    { name: "permissions.update", resource: "permissions", action: "update" },
    { name: "permissions.delete", resource: "permissions", action: "delete" },
    { name: "permissions.manage", resource: "permissions", action: "manage" },
    {
      name: "role-permissions.create",
      resource: "role-permissions",
      action: "create",
    },
    {
      name: "role-permissions.read",
      resource: "role-permissions",
      action: "read",
    },
    {
      name: "role-permissions.update",
      resource: "role-permissions",
      action: "update",
    },
    {
      name: "role-permissions.delete",
      resource: "role-permissions",
      action: "delete",
    },
    {
      name: "role-permissions.manage",
      resource: "role-permissions",
      action: "manage",
    },
    {
      name: "user-permissions.create",
      resource: "user-permissions",
      action: "create",
    },
    {
      name: "user-permissions.read",
      resource: "user-permissions",
      action: "read",
    },
    {
      name: "user-permissions.update",
      resource: "user-permissions",
      action: "update",
    },
    {
      name: "user-permissions.delete",
      resource: "user-permissions",
      action: "delete",
    },
    {
      name: "user-permissions.manage",
      resource: "user-permissions",
      action: "manage",
    },
    { name: "tools.create", resource: "tools", action: "create" },
    { name: "tools.read", resource: "tools", action: "read" },
    { name: "tools.update", resource: "tools", action: "update" },
    { name: "tools.delete", resource: "tools", action: "delete" },
    { name: "tools.manage", resource: "tools", action: "manage" },
    { name: "clusters.create", resource: "clusters", action: "create" },
    { name: "clusters.read", resource: "clusters", action: "read" },
    { name: "clusters.update", resource: "clusters", action: "update" },
    { name: "clusters.delete", resource: "clusters", action: "delete" },
    { name: "clusters.manage", resource: "clusters", action: "manage" },
    {
      name: "parameter-categories.create",
      resource: "parameter-categories",
      action: "create",
    },
    {
      name: "parameter-categories.read",
      resource: "parameter-categories",
      action: "read",
    },
    {
      name: "parameter-categories.update",
      resource: "parameter-categories",
      action: "update",
    },
    {
      name: "parameter-categories.delete",
      resource: "parameter-categories",
      action: "delete",
    },
    {
      name: "parameter-categories.manage",
      resource: "parameter-categories",
      action: "manage",
    },
    { name: "parameters.create", resource: "parameters", action: "create" },
    { name: "parameters.read", resource: "parameters", action: "read" },
    { name: "parameters.update", resource: "parameters", action: "update" },
    { name: "parameters.delete", resource: "parameters", action: "delete" },
    { name: "parameters.manage", resource: "parameters", action: "manage" },
  ] as const;

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

  // Create or get roles
  console.log("👥 Syncing roles...");
  const existingSuperAdmin = await db.query.roles.findFirst({
    where: eq(roles.name, "super_admin"),
  });

  const existingAdmin = await db.query.roles.findFirst({
    where: eq(roles.name, "admin"),
  });

  const existingUser = await db.query.roles.findFirst({
    where: eq(roles.name, "user"),
  });

  const superAdminRole =
    existingSuperAdmin ||
    (
      await db
        .insert(roles)
        .values({
          name: "super_admin",
          description: "All permissions",
        })
        .returning()
    )[0];

  const adminRole =
    existingAdmin ||
    (
      await db
        .insert(roles)
        .values({
          name: "admin",
          description: "Full access",
        })
        .returning()
    )[0];

  const userRole =
    existingUser ||
    (
      await db
        .insert(roles)
        .values({
          name: "user",
          description: "Regular user",
        })
        .returning()
    )[0];

  if (!superAdminRole || !adminRole || !userRole) {
    throw new Error("Failed to create or retrieve roles");
  }

  console.log("✅ Roles synced: super_admin, admin, user");

  // Sync permissions to roles (idempotent)
  console.log("🔐 Syncing permissions to roles...");

  // Get existing role permissions
  const existingRolePerms = await db.query.rolePermissions.findMany();
  const existingRolePermSet = new Set(
    existingRolePerms.map((rp) => `${rp.roleId}-${rp.permissionId}`)
  );

  const rolePermissionsToAdd = [];

  // Super Admin and Admin get all permissions
  for (const perm of allPerms) {
    const superAdminKey = `${superAdminRole.id}-${perm.id}`;
    const adminKey = `${adminRole.id}-${perm.id}`;

    if (!existingRolePermSet.has(superAdminKey)) {
      rolePermissionsToAdd.push({
        roleId: superAdminRole.id,
        permissionId: perm.id,
      });
    }

    if (!existingRolePermSet.has(adminKey)) {
      rolePermissionsToAdd.push({
        roleId: adminRole.id,
        permissionId: perm.id,
      });
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
