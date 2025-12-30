import { inArray } from "drizzle-orm";
import { db } from "../../client";
import { regencies, districts } from "../../schema";
import { getIndonesianDistricts } from "../utils/indonesian-countries/index";

type InsertDistrict = typeof districts.$inferInsert;

const generateDistricts = async (): Promise<InsertDistrict[]> => {
  const districtsList = await getIndonesianDistricts();

  // extract unique regency IDs
  const uniqueRegencyOldIds = [
    ...new Set(districtsList.map((d) => Number(d.regency_id))),
  ];

  // fetch all regencies in a single query
  const regencyRecords = await db.query.regencies.findMany({
    where: inArray(regencies.oldId, uniqueRegencyOldIds),
  });

  // create a map for O(1) lookups
  const regencyMap = new Map(regencyRecords.map((r) => [r.oldId, r.id]));

  // map districts with regency IDs
  return districtsList.map((district) => {
    const oldRegencyId = Number(district.regency_id);
    const regencyId = regencyMap.get(oldRegencyId);

    if (!regencyId) {
      throw new Error(`Regency with oldId ${oldRegencyId} not found`);
    }

    return {
      oldId: Number(district.id),
      regencyId,
      oldRegencyId,
      name: district.name,
    };
  });
};

async function seedDistricts() {
  const districtsData = await generateDistricts();

  await db.delete(districts).execute(); // Hapus semua data yang ada sebelum melakukan seed ulang

  await db.insert(districts).values(districtsData).execute();
  console.log("✅ Districts have been seeded");
}

export default seedDistricts;
