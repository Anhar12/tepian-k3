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
    // ==================== USERS & AUTH ====================
    { name: "users.view", resource: "users", action: "view" },
    { name: "users.create", resource: "users", action: "create" },
    { name: "users.read", resource: "users", action: "read" },
    { name: "users.update", resource: "users", action: "update" },
    { name: "users.delete", resource: "users", action: "delete" },

    // ==================== ROLES ====================
    { name: "roles.view", resource: "roles", action: "view" },
    { name: "roles.create", resource: "roles", action: "create" },
    { name: "roles.read", resource: "roles", action: "read" },
    { name: "roles.update", resource: "roles", action: "update" },
    { name: "roles.delete", resource: "roles", action: "delete" },

    // ==================== PERMISSIONS ====================
    { name: "permissions.view", resource: "permissions", action: "view" },
    { name: "permissions.create", resource: "permissions", action: "create" },
    { name: "permissions.read", resource: "permissions", action: "read" },
    { name: "permissions.update", resource: "permissions", action: "update" },
    { name: "permissions.delete", resource: "permissions", action: "delete" },

    // ==================== ROLE PERMISSIONS ====================
    {
      name: "role-permissions.view",
      resource: "role-permissions",
      action: "view",
    },
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

    // ==================== USER PERMISSIONS ====================
    {
      name: "user-permissions.view",
      resource: "user-permissions",
      action: "view",
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

    // ==================== TOOLS ====================
    { name: "tools.view", resource: "tools", action: "view" },
    { name: "tools.create", resource: "tools", action: "create" },
    { name: "tools.read", resource: "tools", action: "read" },
    { name: "tools.update", resource: "tools", action: "update" },
    { name: "tools.delete", resource: "tools", action: "delete" },

    // ==================== CLUSTERS ====================
    { name: "clusters.view", resource: "clusters", action: "view" },
    { name: "clusters.create", resource: "clusters", action: "create" },
    { name: "clusters.read", resource: "clusters", action: "read" },
    { name: "clusters.update", resource: "clusters", action: "update" },
    { name: "clusters.delete", resource: "clusters", action: "delete" },

    // ==================== PARAMETER CATEGORIES ====================
    {
      name: "parameter-categories.view",
      resource: "parameter-categories",
      action: "view",
    },
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

    // ==================== PARAMETERS ====================
    { name: "parameters.view", resource: "parameters", action: "view" },
    { name: "parameters.create", resource: "parameters", action: "create" },
    { name: "parameters.read", resource: "parameters", action: "read" },
    { name: "parameters.update", resource: "parameters", action: "update" },
    { name: "parameters.delete", resource: "parameters", action: "delete" },

    // ==================== PARAMETER TOOLS ====================
    {
      name: "parameter-tool.view",
      resource: "parameter-tool",
      action: "view",
    },
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

    // ==================== PROVINCES ====================
    { name: "provinces.view", resource: "provinces", action: "view" },
    { name: "provinces.create", resource: "provinces", action: "create" },
    { name: "provinces.read", resource: "provinces", action: "read" },
    { name: "provinces.update", resource: "provinces", action: "update" },
    { name: "provinces.delete", resource: "provinces", action: "delete" },

    // ==================== REGENCIES ====================
    { name: "regencies.view", resource: "regencies", action: "view" },
    { name: "regencies.create", resource: "regencies", action: "create" },
    { name: "regencies.read", resource: "regencies", action: "read" },
    { name: "regencies.update", resource: "regencies", action: "update" },
    { name: "regencies.delete", resource: "regencies", action: "delete" },

    // ==================== DISTRICTS ====================
    { name: "districts.view", resource: "districts", action: "view" },
    { name: "districts.create", resource: "districts", action: "create" },
    { name: "districts.read", resource: "districts", action: "read" },
    { name: "districts.update", resource: "districts", action: "update" },
    { name: "districts.delete", resource: "districts", action: "delete" },

    // ==================== VILLAGES ====================
    { name: "villages.view", resource: "villages", action: "view" },
    { name: "villages.create", resource: "villages", action: "create" },
    { name: "villages.read", resource: "villages", action: "read" },
    { name: "villages.update", resource: "villages", action: "update" },
    { name: "villages.delete", resource: "villages", action: "delete" },

    // ==================== KBLI ====================
    { name: "kbli.view", resource: "kbli", action: "view" },
    { name: "kbli.create", resource: "kbli", action: "create" },
    { name: "kbli.read", resource: "kbli", action: "read" },
    { name: "kbli.update", resource: "kbli", action: "update" },
    { name: "kbli.delete", resource: "kbli", action: "delete" },

    // ==================== USER COMPANIES ====================
    {
      name: "user-company.view",
      resource: "user-company",
      action: "view",
    },
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

    // ==================== USER COMPANY TESTING LOCATIONS ====================
    {
      name: "user-company-testing-location.view",
      resource: "user-company-testing-location",
      action: "view",
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

    // ==================== CART ====================
    { name: "cart.view", resource: "cart", action: "view" },
    { name: "cart.create", resource: "cart", action: "create" },
    { name: "cart.read", resource: "cart", action: "read" },
    { name: "cart.update", resource: "cart", action: "update" },
    { name: "cart.delete", resource: "cart", action: "delete" },

    // ==================== ORDERS ====================
    { name: "orders.view", resource: "orders", action: "view" },
    { name: "orders.create", resource: "orders", action: "create" },
    { name: "orders.read", resource: "orders", action: "read" },
    { name: "orders.update", resource: "orders", action: "update" },
    { name: "orders.delete", resource: "orders", action: "delete" },

    // ==================== ORDER ITEMS ====================
    { name: "order-items.view", resource: "order-items", action: "view" },
    { name: "order-items.create", resource: "order-items", action: "create" },
    { name: "order-items.read", resource: "order-items", action: "read" },
    { name: "order-items.update", resource: "order-items", action: "update" },
    { name: "order-items.delete", resource: "order-items", action: "delete" },

    // ==================== ORDER STATUS HISTORY ====================
    {
      name: "order-status-history.view",
      resource: "order-status-history",
      action: "view",
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

    // ==================== TESTING ====================
    { name: "testing.view", resource: "testing", action: "view" },
    { name: "testing.create", resource: "testing", action: "create" },
    { name: "testing.read", resource: "testing", action: "read" },
    { name: "testing.update", resource: "testing", action: "update" },
    { name: "testing.delete", resource: "testing", action: "delete" },

    // ==================== TESTING ITEMS ====================
    { name: "testing-item.view", resource: "testing-item", action: "view" },
    { name: "testing-item.create", resource: "testing-item", action: "create" },
    { name: "testing-item.read", resource: "testing-item", action: "read" },
    { name: "testing-item.update", resource: "testing-item", action: "update" },
    { name: "testing-item.delete", resource: "testing-item", action: "delete" },

    // ==================== DOCUMENTS ====================
    { name: "documents.view", resource: "documents", action: "view" },
    { name: "documents.create", resource: "documents", action: "create" },
    { name: "documents.read", resource: "documents", action: "read" },
    { name: "documents.update", resource: "documents", action: "update" },
    { name: "documents.delete", resource: "documents", action: "delete" },

    // ==================== DOCUMENT SIGNATURES ====================
    {
      name: "document-signatures.view",
      resource: "document-signatures",
      action: "view",
    },
    {
      name: "document-signatures.create",
      resource: "document-signatures",
      action: "create",
    },
    {
      name: "document-signatures.read",
      resource: "document-signatures",
      action: "read",
    },
    {
      name: "document-signatures.update",
      resource: "document-signatures",
      action: "update",
    },
    {
      name: "document-signatures.delete",
      resource: "document-signatures",
      action: "delete",
    },

    // ==================== DOCUMENT VERIFICATIONS ====================
    {
      name: "document-verifications.view",
      resource: "document-verifications",
      action: "view",
    },
    {
      name: "document-verifications.create",
      resource: "document-verifications",
      action: "create",
    },
    {
      name: "document-verifications.read",
      resource: "document-verifications",
      action: "read",
    },
    {
      name: "document-verifications.update",
      resource: "document-verifications",
      action: "update",
    },
    {
      name: "document-verifications.delete",
      resource: "document-verifications",
      action: "delete",
    },

    // ==================== AUDITS ====================
    { name: "audits.view", resource: "audits", action: "view" },
    { name: "audits.create", resource: "audits", action: "create" },
    { name: "audits.read", resource: "audits", action: "read" },
    { name: "audits.update", resource: "audits", action: "update" },
    { name: "audits.delete", resource: "audits", action: "delete" },

    // ==================== EMPLOYEES ====================
    { name: "employees.view", resource: "employees", action: "view" },
    { name: "employees.create", resource: "employees", action: "create" },
    { name: "employees.read", resource: "employees", action: "read" },
    { name: "employees.update", resource: "employees", action: "update" },
    { name: "employees.delete", resource: "employees", action: "delete" },

    // ==================== WORKSHEETS ====================
    { name: "worksheets.view", resource: "worksheets", action: "view" },
    { name: "worksheets.create", resource: "worksheets", action: "create" },
    { name: "worksheets.read", resource: "worksheets", action: "read" },
    { name: "worksheets.update", resource: "worksheets", action: "update" },
    { name: "worksheets.delete", resource: "worksheets", action: "delete" },

    // ==================== WORKSHEET ITEMS ====================
    {
      name: "worksheet-items.view",
      resource: "worksheet-items",
      action: "view",
    },
    {
      name: "worksheet-items.create",
      resource: "worksheet-items",
      action: "create",
    },
    {
      name: "worksheet-items.read",
      resource: "worksheet-items",
      action: "read",
    },
    {
      name: "worksheet-items.update",
      resource: "worksheet-items",
      action: "update",
    },
    {
      name: "worksheet-items.delete",
      resource: "worksheet-items",
      action: "delete",
    },

    // ==================== WORKSHEET TOOLS ====================
    {
      name: "worksheet-tools.view",
      resource: "worksheet-tools",
      action: "view",
    },
    {
      name: "worksheet-tools.create",
      resource: "worksheet-tools",
      action: "create",
    },
    {
      name: "worksheet-tools.read",
      resource: "worksheet-tools",
      action: "read",
    },
    {
      name: "worksheet-tools.update",
      resource: "worksheet-tools",
      action: "update",
    },
    {
      name: "worksheet-tools.delete",
      resource: "worksheet-tools",
      action: "delete",
    },

    // ==================== WORKSHEET NOTES ====================
    {
      name: "worksheet-notes.view",
      resource: "worksheet-notes",
      action: "view",
    },
    {
      name: "worksheet-notes.create",
      resource: "worksheet-notes",
      action: "create",
    },
    {
      name: "worksheet-notes.read",
      resource: "worksheet-notes",
      action: "read",
    },
    {
      name: "worksheet-notes.update",
      resource: "worksheet-notes",
      action: "update",
    },
    {
      name: "worksheet-notes.delete",
      resource: "worksheet-notes",
      action: "delete",
    },

    // ==================== WORKSHEET ASSIGNMENTS ====================
    {
      name: "worksheet-assignments.view",
      resource: "worksheet-assignments",
      action: "view",
    },
    {
      name: "worksheet-assignments.create",
      resource: "worksheet-assignments",
      action: "create",
    },
    {
      name: "worksheet-assignments.read",
      resource: "worksheet-assignments",
      action: "read",
    },
    {
      name: "worksheet-assignments.update",
      resource: "worksheet-assignments",
      action: "update",
    },
    {
      name: "worksheet-assignments.delete",
      resource: "worksheet-assignments",
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
