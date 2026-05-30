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
import { and, eq, inArray } from "drizzle-orm";
import seedClusters from "./clusters";
import seedParameterCategories from "./parameter-categories";
import seedProvinces from "./provinces";
import seedRegencies from "./regencies";
import seedDistricts from "./districts";
import seedVillages from "./villages";
import seedKblis from "./kblis";
import seedParameters from "./parameter";
import seedTools from "./tools";
import seedChemicalMaterials from "./chemical-materials";
import seedEmployees from "./employee";
import {
  generatePermissionsList,
  generateRolesList,
  ROLE_PERMISSIONS,
  type Role,
} from "@tepian-k3/constants";
import { seedPositions } from "./positions";
import { seedUserCompanies } from "./user-companies";
import { seedOrders } from "./orders";
import { clearAllCache } from "./clear-cache";

/**
 * Daftar akun uji untuk setiap peran dalam sistem.
 * Di lingkungan produksi hanya super_admin dan admin yang dibuat.
 * Di lingkungan non-produksi seluruh peran dibuatkan akun uji.
 */
const SEED_USERS: {
  role: Role;
  email: string;
  name: string;
  productionOnly?: boolean;
}[] = [
  {
    role: "super_admin",
    email: "superadmin@mail.com",
    name: "Super Admin",
    productionOnly: true,
  },
  {
    role: "admin",
    email: "admin@mail.com",
    name: "Admin",
    productionOnly: true,
  },
  { role: "user", email: "user@mail.com", name: "User" },
  { role: "employee", email: "employee@mail.com", name: "Employee" },
  {
    role: "petugas_sampling",
    email: "sample-collector@mail.com",
    name: "Petugas Sampling",
  },
  {
    role: "petugas_laboratorium",
    email: "lab-technician@mail.com",
    name: "Petugas Laboratorium",
  },
  {
    role: "koordinator_pengujian",
    email: "lab-manager@mail.com",
    name: "Koordinator Pengujian",
  },
  { role: "kaji_ulang", email: "kaji-ulang@mail.com", name: "Kaji Ulang" },
  {
    role: "kepala_balai",
    email: "head@mail.com",
    name: "Kepala Balai",
  },
  {
    role: "koordinator_administrasi",
    email: "admin-manager@mail.com",
    name: "Koordinator Administrasi",
  },
  {
    role: "bendahara",
    email: "treasurer@mail.com",
    name: "Bendahara Penerimaan",
  },
  {
    role: "tim_penjadwalan",
    email: "penjadwalan@mail.com",
    name: "Tim Penjadwalan",
  },
  {
    role: "tim_peralatan",
    email: "equipment@mail.com",
    name: "Tim Peralatan",
  },
  {
    role: "petugas_koding",
    email: "petugas-koding@mail.com",
    name: "Petugas Koding",
  },
  { role: "viewer", email: "viewer@mail.com", name: "Viewer" },
];

async function seed() {
  console.log("🌱 Starting database seeding...");

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log(
      "🔒 Production environment detected — only super_admin and admin will be seeded.",
    );
  }

  // Generate all permissions using type-safe utility.
  // Each resource contributes its base CRUD actions (view, create, read,
  // update, delete) plus any approval actions it opts into (review, verify,
  // approve, reject) via the RESOURCES config in @tepian-k3/constants.
  const permissionsList = generatePermissionsList();
  const generatedPermNames = new Set<string>(
    permissionsList.map((p) => p.name),
  );

  // Permissions, roles, and role-permission assignments form the structural
  // authorization state. They are reconciled declaratively (add missing +
  // remove stale) inside a single transaction so a mid-sync failure can never
  // leave authorization half-applied. This runs in every environment.
  const allRoles = await db.transaction(async (tx) => {
    // ---- Permissions ----
    console.log("📋 Syncing permissions...");
    const existingPerms = await tx.query.permission.findMany();
    const existingPermNames = new Set(existingPerms.map((p) => p.name));

    const newPermissions = permissionsList.filter(
      (p) => !existingPermNames.has(p.name),
    );

    if (newPermissions.length > 0) {
      console.log(`   ➕ Adding ${newPermissions.length} new permissions...`);
      await tx.insert(permission).values(newPermissions);
    }

    // Prune permissions no longer produced by generatePermissionsList()
    // (e.g. nonsensical approval actions like `logs.approve` after a resource's
    // approvalActions config changes). Cascades to role_permissions and
    // user_permissions. Mirrors the stale role-permission reconcile below.
    const orphanPerms = existingPerms.filter(
      (p) => !generatedPermNames.has(p.name),
    );
    if (orphanPerms.length > 0) {
      console.log(
        `   🗑️  Removing ${orphanPerms.length} orphaned permissions...`,
      );
      await tx.delete(permission).where(
        inArray(
          permission.id,
          orphanPerms.map((p) => p.id),
        ),
      );
    }

    // Re-read the reconciled permission set for id lookups
    const allPerms = await tx.query.permission.findMany();
    console.log(`✅ ${allPerms.length} permissions in database`);

    // ---- Roles ----
    console.log("👥 Syncing roles...");

    const rolesList = generateRolesList();
    const existingRoles = await tx.query.roles.findMany();
    const existingRoleNames = new Set(existingRoles.map((r) => r.name));

    const newRoles = rolesList.filter((r) => !existingRoleNames.has(r.name));

    let rolesInDb = [...existingRoles];

    if (newRoles.length > 0) {
      console.log(`   ➕ Adding ${newRoles.length} new roles...`);
      const insertedRoles = await tx.insert(roles).values(newRoles).returning();
      rolesInDb = [...rolesInDb, ...insertedRoles];
    }

    console.log(`✅ ${rolesInDb.length} roles in database`);

    // ---- Role permissions ----
    console.log("🔐 Syncing permissions to roles...");

    const txRoleMap = new Map(rolesInDb.map((r) => [r.name as Role, r]));
    const permissionMap = new Map(allPerms.map((p) => [p.name, p.id]));

    // Read existing assignments AFTER the orphan prune (cascade already removed
    // assignments for pruned permissions).
    const existingRolePerms = await tx.query.rolePermissions.findMany();
    const existingRolePermSet = new Set(
      existingRolePerms.map((rp) => `${rp.roleId}-${rp.permissionId}`),
    );

    const rolePermissionsToAdd = [];

    // Build the full set of role-permission pairs that SHOULD exist
    const expectedRolePermSet = new Set<string>();

    // Assign permissions to each role based on ROLE_PERMISSIONS
    for (const [roleName, permissionNames] of Object.entries(
      ROLE_PERMISSIONS,
    )) {
      const role = txRoleMap.get(roleName as Role);
      if (!role) {
        console.warn(
          `⚠️  Role '${roleName}' not found in database, skipping...`,
        );
        continue;
      }

      for (const permissionName of permissionNames) {
        const permissionId = permissionMap.get(permissionName);
        if (!permissionId) {
          console.warn(
            `⚠️  Permission '${permissionName}' not found for role '${roleName}', skipping...`,
          );
          continue;
        }

        const key = `${role.id}-${permissionId}`;
        expectedRolePermSet.add(key);

        if (!existingRolePermSet.has(key)) {
          rolePermissionsToAdd.push({
            roleId: role.id,
            permissionId: permissionId,
          });
        }
      }
    }

    // Remove stale role-permission assignments no longer in ROLE_PERMISSIONS
    const staleRolePerms = existingRolePerms.filter(
      (rp) => !expectedRolePermSet.has(`${rp.roleId}-${rp.permissionId}`),
    );

    if (staleRolePerms.length > 0) {
      console.log(
        `   🗑️  Removing ${staleRolePerms.length} stale role-permission assignments...`,
      );
      // Group by roleId so we can batch-delete per role
      const staleByRole = Map.groupBy(staleRolePerms, (rp) => rp.roleId);
      for (const [roleId, entries] of staleByRole) {
        const permIds = entries.map((rp) => rp.permissionId);
        await tx
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              inArray(rolePermissions.permissionId, permIds),
            ),
          );
      }
    }

    if (rolePermissionsToAdd.length > 0) {
      console.log(
        `   ➕ Adding ${rolePermissionsToAdd.length} new role-permission assignments...`,
      );
      await tx.insert(rolePermissions).values(rolePermissionsToAdd);
    }

    console.log("✅ Role permissions synced");

    return rolesInDb;
  });

  // Create a map for easy role lookup (used by the seed-user step below)
  const roleMap = new Map(allRoles.map((r) => [r.name as Role, r]));

  // seeding other data can go here...
  await seedClusters();
  await seedParameterCategories();
  await seedParameters();
  await seedTools();
  await seedChemicalMaterials();
  const provinceMap = await seedProvinces();
  const regencyMap = await seedRegencies(provinceMap);
  const districtMap = await seedDistricts(regencyMap);
  await seedVillages(districtMap);
  await seedKblis();
  await clearAllCache();
  await seedPositions();

  // Create one seed user per role.
  // In production only users marked productionOnly: true are created.
  // Must run before seedEmployees so test users exist when employee records are linked.
  console.log("👤 Syncing example users...");

  const password = await hash("test12345");

  const usersToSeed = isProduction
    ? SEED_USERS.filter((u) => u.productionOnly)
    : SEED_USERS;

  const seedUserRecords: { userId: string; roleId: string }[] = [];

  for (const { role, email, name } of usersToSeed) {
    const roleRecord = roleMap.get(role);
    if (!roleRecord) {
      console.warn(`⚠️  Role '${role}' not found, skipping user '${email}'`);
      continue;
    }

    let userRecord = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!userRecord) {
      const [inserted] = await db
        .insert(users)
        .values({
          email,
          password,
          address: "Jl. Test Address No.123",
          name,
          phone: "081234567890",
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        })
        .returning();
      userRecord = inserted;
    }

    if (!userRecord) {
      console.warn(`⚠️  Failed to create user '${email}', skipping...`);
      continue;
    }

    seedUserRecords.push({ userId: userRecord.id, roleId: roleRecord.id });
  }

  if (seedUserRecords.length > 0) {
    await db.insert(userRoles).values(seedUserRecords).onConflictDoNothing();
  }

  console.log("✅ Users synced");
  console.log("✅ User roles synced");

  await seedEmployees(isProduction);
  await seedUserCompanies(isProduction);
  await seedOrders(isProduction);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📝 Default credentials (password: test12345):");
  for (const { role, email } of usersToSeed) {
    const label = role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    console.log(`   ${label.padEnd(22)}: ${email}`);
  }
  if (isProduction) {
    console.log(
      "\n⚠️  Hanya super_admin dan admin yang dibuat di lingkungan produksi.",
    );
    console.log("⚠️  Segera ganti password default setelah login pertama!\n");
  } else {
    console.log("\n⚠️  Please change these credentials in production!\n");
  }

  exit(0);
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  exit(1);
});
