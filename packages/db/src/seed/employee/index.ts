import { hash } from "@node-rs/argon2";
import { db } from "../../client";
import { employees, users, roles, userRoles, positions } from "../../schema";
import { fakerID_ID as faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";

const employeesNames: {
  name: string;
  position: string;
}[] = [
  {
    name: "Waluyo",
    position: "Kepala Regu",
  },
  {
    name: "Rahmat",
    position: "Ketua Regu Kimia",
  },
  {
    name: "Zaqqi Muawanah",
    position: "Penguji K3 Ahli Madya",
  },
  {
    name: "Heri Purwanto",
    position: "Penguji K3 Ahli Madya",
  },
  {
    name: "Rahman Nur",
    position: "Penguji K3 Ahli Muda",
  },
  {
    name: "Muliyadi",
    position: "Penguji K3 Ahli Muda",
  },
  {
    name: "David Lagadoni",
    position: "Penguji K3 Ahli Muda",
  },
  {
    name: "Ahmad Yani",
    position: "Penguji K3 Ahli Muda",
  },
  {
    name: "Ugeng Priyanto",
    position: "Penguji K3 Ahli Pertama",
  },
  {
    name: "Arif Sumarianto",
    position: "Penguji K3 Ahli Pertama",
  },
  {
    name: "Rizky Katherine",
    position: "Penguji K3 Ahli Pertama",
  },
  {
    name: "Priscella Cindy Samosir",
    position: "Penguji K3 Ahli Pertama",
  },
  {
    name: "Arif Budiman",
    position: "Penguji K3 Ahli Pertama",
  },
  {
    name: "Henny Ayu Nirwala",
    position: "Penguji K3 Ahli Pertama",
  },
];

const emailGenerator = (name: string) => {
  const formattedName = name.toLowerCase().replace(/ /g, ".");
  return `${formattedName}@mail.com`;
};

async function seedEmployees(isProduction: boolean) {
  console.log("👷 Syncing employees...");

  // Get employee role
  const employeeRole = await db.query.roles.findFirst({
    where: eq(roles.name, "employee"),
  });

  if (!employeeRole) {
    throw new Error("Employee role not found. Please run main seed first.");
  }

  const password = await hash("test12345");

  // Process each employee
  for (const emp of employeesNames) {
    const email = emailGenerator(emp.name);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    let user = existingUser;

    // Create user if doesn't exist
    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          name: emp.name,
          email: email,
          password: password,
          address: faker.location.streetAddress(),
          phone: faker.phone.number({ style: "human" }),
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        })
        .returning();

      user = newUser;
      console.log(`   ➕ Created user: ${emp.name}`);
    }

    if (!user) {
      throw new Error(`Failed to create or retrieve user for ${emp.name}`);
    }

    // Check if employee record exists
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
    });

    // find position id from positions table
    const positionRecord = await db.query.positions.findFirst({
      where: eq(positions.name, emp.position),
    });

    if (!positionRecord) {
      throw new Error(
        `Position '${emp.position}' not found for employee '${emp.name}'. Please run positions seed first.`,
      );
    }

    // Create employee record if doesn't exist
    if (!existingEmployee) {
      await db.insert(employees).values({
        positionId: positionRecord.id,
        userId: user.id,
        name: emp.name,
        email: email,
        type: faker.helpers.arrayElement([
          "I/a",
          "I/b",
          "I/c",
          "I/d",
          "II/a",
          "II/b",
          "II/c",
          "II/d",
          "III/a",
          "III/b",
          "III/c",
          "III/d",
          "IV/a",
          "IV/b",
          "IV/c",
          "IV/d",
          "IV/e",
        ]),
        nip: faker.string.numeric(10),
      });
      console.log(`   ➕ Created employee: ${emp.name} (${emp.position})`);
    }

    // Assign employee role if not already assigned
    const existingUserRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, user.id),
    });

    if (!existingUserRole) {
      await db.insert(userRoles).values({
        userId: user.id,
        roleId: employeeRole.id,
      });
      console.log(`   ➕ Assigned employee role to: ${emp.name}`);
    }
  }

  // Seed test users as employees — skip in production (productionOnly users don't need employee records)
  if (!isProduction) {
    const testEmployeeUsers: { email: string; roleName: string }[] = [
      { email: "superadmin@mail.com", roleName: "super_admin" },
      { email: "admin@mail.com", roleName: "admin" },
      { email: "employee@mail.com", roleName: "employee" },
      { email: "sample-collector@mail.com", roleName: "sample_collector" },
      { email: "lab-technician@mail.com", roleName: "lab_technician" },
      { email: "lab-manager@mail.com", roleName: "lab_manager" },
      { email: "kaji-ulang@mail.com", roleName: "kaji_ulang" },
      { email: "head@mail.com", roleName: "head_of_institution" },
      { email: "admin-manager@mail.com", roleName: "admin_manager" },
      { email: "treasurer@mail.com", roleName: "treasurer" },
      { email: "penjadwalan@mail.com", roleName: "penjadwalan" },
      { email: "equipment@mail.com", roleName: "equipment_officer" },
      { email: "petugas-koding@mail.com", roleName: "petugas_koding" },
    ];

    const defaultPosition = await db.query.positions.findFirst({
      where: eq(positions.name, "Penguji K3 Ahli Pertama"),
    });

    if (!defaultPosition) {
      throw new Error(
        "Default position not found. Please run positions seed first.",
      );
    }

    for (const testUser of testEmployeeUsers) {
      const user = await db.query.users.findFirst({
        where: eq(users.email, testUser.email),
      });

      if (!user) continue;

      const existingEmployee = await db.query.employees.findFirst({
        where: eq(employees.userId, user.id),
      });

      if (!existingEmployee) {
        await db.insert(employees).values({
          positionId: defaultPosition.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          type: "III/a",
          nip: faker.string.numeric(10),
        });
        console.log(
          `   ➕ Created employee record for test user: ${user.email}`,
        );
      }
    }
  }

  console.log("✅ Employees synced successfully");
}

export default seedEmployees;
