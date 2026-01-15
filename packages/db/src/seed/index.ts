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
    {
      name: "parameter-tool.create",
      resource: "parameter-tool",
      action: "create",
    },
    {
      name: "parameter-tool.read",
      resource: "parameter-tool",
      action: "read",
    },
    {
      name: "parameter-tool.update",
      resource: "parameter-tool",
      action: "update",
    },
    {
      name: "parameter-tool.delete",
      resource: "parameter-tool",
      action: "delete",
    },
    {
      name: "parameter-tool.manage",
      resource: "parameter-tool",
      action: "manage",
    },
    { name: "provinces.create", resource: "provinces", action: "create" },
    { name: "provinces.read", resource: "provinces", action: "read" },
    { name: "provinces.update", resource: "provinces", action: "update" },
    { name: "provinces.delete", resource: "provinces", action: "delete" },
    { name: "provinces.manage", resource: "provinces", action: "manage" },
    { name: "regency.create", resource: "regency", action: "create" },
    { name: "regency.read", resource: "regency", action: "read" },
    { name: "regency.update", resource: "regency", action: "update" },
    { name: "regency.delete", resource: "regency", action: "delete" },
    { name: "regency.manage", resource: "regency", action: "manage" },
    { name: "district.create", resource: "districts", action: "create" },
    { name: "district.read", resource: "districts", action: "read" },
    { name: "district.update", resource: "districts", action: "update" },
    { name: "district.delete", resource: "districts", action: "delete" },
    { name: "district.manage", resource: "districts", action: "manage" },
    { name: "village.create", resource: "village", action: "create" },
    { name: "village.read", resource: "village", action: "read" },
    { name: "village.update", resource: "village", action: "update" },
    { name: "village.delete", resource: "village", action: "delete" },
    { name: "village.manage", resource: "village", action: "manage" },
    { name: "kbli.create", resource: "kbli", action: "create" },
    { name: "kbli.read", resource: "kbli", action: "read" },
    { name: "kbli.update", resource: "kbli", action: "update" },
    { name: "kbli.delete", resource: "kbli", action: "delete" },
    { name: "kbli.manage", resource: "kbli", action: "manage" },
    {
      name: "user-company.create",
      resource: "user-company",
      action: "create",
    },
    {
      name: "user-company.read",
      resource: "user-company",
      action: "read",
    },
    {
      name: "user-company.update",
      resource: "user-company",
      action: "update",
    },
    {
      name: "user-company.delete",
      resource: "user-company",
      action: "delete",
    },
    {
      name: "user-company.manage",
      resource: "user-company",
      action: "manage",
    },
    {
      name: "user-company-testing-location.create",
      resource: "user-company-testing-location",
      action: "create",
    },
    {
      name: "user-company-testing-location.read",
      resource: "user-company-testing-location",
      action: "read",
    },
    {
      name: "user-company-testing-location.update",
      resource: "user-company-testing-location",
      action: "update",
    },
    {
      name: "user-company-testing-location.delete",
      resource: "user-company-testing-location",
      action: "delete",
    },
    {
      name: "user-company-testing-location.manage",
      resource: "user-company-testing-location",
      action: "manage",
    },
    {
      name: "order.create",
      resource: "order",
      action: "create",
    },
    {
      name: "order.read",
      resource: "order",
      action: "read",
    },
    {
      name: "order.update",
      resource: "order",
      action: "update",
    },
    {
      name: "order.delete",
      resource: "order",
      action: "delete",
    },
    {
      name: "order-status-history.create",
      resource: "order-status-history",
      action: "create",
    },
    {
      name: "order-status-history.read",
      resource: "order-status-history",
      action: "read",
    },
    {
      name: "order-status-history.update",
      resource: "order-status-history",
      action: "update",
    },
    {
      name: "order-status-history.delete",
      resource: "order-status-history",
      action: "delete",
    },
    {
      name: "document.create",
      resource: "document",
      action: "create",
    },
    {
      name: "document.read",
      resource: "document",
      action: "read",
    },
    {
      name: "document.update",
      resource: "document",
      action: "update",
    },
    {
      name: "document.delete",
      resource: "document",
      action: "delete",
    },
    {
      name: "document-signature.create",
      resource: "document-signature",
      action: "create",
    },
    {
      name: "document-signature.read",
      resource: "document-signature",
      action: "read",
    },
    {
      name: "document-signature.update",
      resource: "document-signature",
      action: "update",
    },
    {
      name: "document-signature.delete",
      resource: "document-signature",
      action: "delete",
    },
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

  const existingEmployee = await db.query.roles.findFirst({
    where: eq(roles.name, "employee"),
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

  const employeeRole =
    existingEmployee ||
    (
      await db
        .insert(roles)
        .values({
          name: "employee",
          description: "Employee role",
        })
        .returning()
    )[0];

  if (!superAdminRole || !adminRole || !userRole || !employeeRole) {
    throw new Error("Failed to create or retrieve roles");
  }

  console.log("✅ Roles synced: super_admin, admin, user, employee");
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

  // User role gets only user-company and user-company-testing-location permissions
  const userPermissionResources = [
    "user-company",
    "user-company-testing-location",
  ];
  const userPermissions = allPerms.filter((perm) =>
    userPermissionResources.includes(perm.resource)
  );

  for (const perm of userPermissions) {
    const userKey = `${userRole.id}-${perm.id}`;
    if (!existingRolePermSet.has(userKey)) {
      rolePermissionsToAdd.push({
        roleId: userRole.id,
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
