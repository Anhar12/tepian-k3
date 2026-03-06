import { db } from "../client";
import {
  userCompanies,
  userCompanyTestingLocation,
  users,
  regencies,
  districts,
  villages,
} from "../schema";
import { eq } from "drizzle-orm";

/**
 * Seeds user companies and their testing locations for development only.
 * Creates 2 sample companies for the "user@mail.com" test account,
 * each with 2 testing locations.
 *
 * @param isProduction - When true, this function is a no-op
 */
export async function seedUserCompanies(isProduction: boolean) {
  if (isProduction) return;

  console.log("🏢 Syncing user companies...");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, "user@mail.com"),
  });

  if (!userRecord) {
    console.warn(
      "⚠️  Test user 'user@mail.com' not found, skipping user companies...",
    );
    return;
  }

  const kbli = await db.query.kblis.findFirst();
  if (!kbli) {
    console.warn("⚠️  No KBLI records found, skipping user companies...");
    return;
  }

  const province = await db.query.provinces.findFirst();
  if (!province) {
    console.warn("⚠️  No province records found, skipping user companies...");
    return;
  }

  const regency = await db.query.regencies.findFirst({
    where: eq(regencies.provinceId, province.id),
  });
  if (!regency) {
    console.warn("⚠️  No regency records found, skipping user companies...");
    return;
  }

  const district = await db.query.districts.findFirst({
    where: eq(districts.regencyId, regency.id),
  });
  if (!district) {
    console.warn("⚠️  No district records found, skipping user companies...");
    return;
  }

  const village = await db.query.villages.findFirst({
    where: eq(villages.districtId, district.id),
  });
  if (!village) {
    console.warn("⚠️  No village records found, skipping user companies...");
    return;
  }

  const SEED_COMPANIES = [
    {
      name: "PT Maju Bersama Sejahtera",
      address: "Jl. Industri Raya No. 1, Kawasan Industri Pulogadung",
      email: "info@majubersama.co.id",
      responsibleTestingPerson: "Budi Santoso",
      responsibleTestingPersonPhone: "081200000001",
      responsibleTestingPersonEmail: "budi@majubersama.co.id",
      companyBankName: "Bank BCA",
      companyBankAccount: "1234567890",
      companyBankAccountName: "PT Maju Bersama Sejahtera",
      maleWorkers: 120,
      femaleWorkers: 45,
      healthFacilityAvailable: true,
      wlkpStatus: true,
      wlkp: "WLKP-001-2024",
    },
    {
      name: "CV Karya Mandiri Teknik",
      address: "Jl. Raya Bogor KM 28, Cibinong, Bogor",
      email: "info@karyamandiri.co.id",
      responsibleTestingPerson: "Siti Rahayu",
      responsibleTestingPersonPhone: "081200000002",
      responsibleTestingPersonEmail: "siti@karyamandiri.co.id",
      companyBankName: "Bank Mandiri",
      companyBankAccount: "0987654321",
      companyBankAccountName: "CV Karya Mandiri Teknik",
      maleWorkers: 60,
      femaleWorkers: 20,
      healthFacilityAvailable: false,
      wlkpStatus: false,
      wlkp: null,
    },
  ] as const;

  for (const companyData of SEED_COMPANIES) {
    const existing = await db.query.userCompanies.findFirst({
      where: eq(userCompanies.name, companyData.name),
    });

    let companyId: string;

    if (!existing) {
      const [inserted] = await db
        .insert(userCompanies)
        .values({
          userId: userRecord.id,
          kbliId: kbli.id,
          provinceId: province.id,
          regencyId: regency.id,
          districtId: district.id,
          villageId: village.id,
          companyPictureUrl: "/uploads/placeholder-company.png",
          ...companyData,
        })
        .returning({ id: userCompanies.id });
      companyId = inserted!.id;
      console.log(`   ➕ Created company: ${companyData.name}`);
    } else {
      companyId = existing.id;
      console.log(`   ✓  Company already exists: ${companyData.name}`);
    }

    // Seed 2 testing locations per company
    const SEED_LOCATIONS = [
      { name: `Lokasi Pengujian 1 — ${companyData.name}` },
      { name: `Lokasi Pengujian 2 — ${companyData.name}` },
    ];

    for (const locationData of SEED_LOCATIONS) {
      const existingLoc = await db.query.userCompanyTestingLocation.findFirst({
        where: eq(userCompanyTestingLocation.name, locationData.name),
      });

      if (!existingLoc) {
        await db.insert(userCompanyTestingLocation).values({
          userCompanyId: companyId,
          name: locationData.name,
          regencyId: regency.id,
          districtId: district.id,
          userId: userRecord.id,
        });
        console.log(`      ➕ Created location: ${locationData.name}`);
      } else {
        console.log(`      ✓  Location already exists: ${locationData.name}`);
      }
    }
  }

  console.log("✅ User companies synced");
}
