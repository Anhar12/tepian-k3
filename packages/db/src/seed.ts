import { db } from "./client";
import { permission, rolePermissions, roles, userRoles, users } from "./schema";

async function seed() {
  // Create permissions
  const perms = await db
    .insert(permission)
    .values([
      { name: "users.create", resource: "users", action: "create" },
      { name: "users.read", resource: "users", action: "read" },
      { name: "users.update", resource: "users", action: "update" },
      { name: "users.delete", resource: "users", action: "delete" },
      { name: "users.manage", resource: "users", action: "manage" },
    ])
    .returning();

  // Create roles
  const superAdminRole = await db
    .insert(roles)
    .values({
      name: "super_admin",
      description: "All permissions",
    })
    .returning();

  const adminRole = await db
    .insert(roles)
    .values({
      name: "admin",
      description: "Full access",
    })
    .returning();

  const userRole = await db
    .insert(roles)
    .values({
      name: "user",
      description: "Regular user",
    })
    .returning();

  if (!superAdminRole[0] || !adminRole[0] || !userRole[0]) {
    throw new Error("Failed to create roles");
  }

  // Assign permissions to roles
  //   const usersCreate = perms.find((p) => p.name === "users.create");
  //   const usersUpdate = perms.find((p) => p.name === "users.update");
  //   const usersDelete = perms.find((p) => p.name === "users.delete");
  //   const usersRead = perms.find((p) => p.name === "users.read");
  //   const usersManage = perms.find((p) => p.name === "users.manage");

  await db.insert(rolePermissions).values([
    // Super Admin gets all permissions
    ...perms.map((p) => ({
      roleId: superAdminRole[0]!.id,
      permissionId: p.id,
    })),

    // Admin gets all permissions
    ...perms.map((p) => ({ roleId: adminRole[0]!.id, permissionId: p.id })),
  ]);

  // Create example user with multiple roles
  const superAdmin = await db
    .insert(users)
    .values({
      email: "superadmin@mail.com",
      password: "test12345",
      address: "Jl. Test Address No.123",
      name: "superadmin",
      phone: "081234567890",
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    })
    .returning();

  const admin = await db
    .insert(users)
    .values({
      email: "admin@mail.com",
      password: "test12345",
      address: "Jl. Test Address No.123",
      name: "admin",
      phone: "081234567890",
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    })
    .returning();

  const exampleUser = await db
    .insert(users)
    .values({
      email: "user@mail.com",
      password: "test12345",
      address: "Jl. Test Address No.123",
      name: "user",
      phone: "081234567890",
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    })
    .returning();

  if (!superAdmin[0] || !admin[0] || !exampleUser[0]) {
    throw new Error("Failed to create example users");
  }

  // Assign roles to example user
  await db.insert(userRoles).values([
    { userId: superAdmin[0].id, roleId: superAdminRole[0].id },
    { userId: admin[0].id, roleId: adminRole[0].id },
    { userId: exampleUser[0].id, roleId: userRole[0].id },
  ]);

  console.log("✅ Seeded roles, permissions, and users");
}

seed();
