import { inArray } from "drizzle-orm";
import { db } from "../../client";
import { districts, villages } from "../../schema";
import { getIndonesianVillages } from "../utils/indonesian-countries/index";

type InsertVillage = typeof villages.$inferInsert;

const BATCH_SIZE = 1000; // Adjust based on your needs

const generateVillages = async (): Promise<InsertVillage[]> => {
  const villagesList = await getIndonesianVillages();

  // extract unique district IDs
  const uniqueDistrictOldIds = [
    ...new Set(villagesList.map((v) => Number(v.district_id))),
  ];

  // fetch all districts in a single query
  const districtRecords = await db.query.districts.findMany({
    where: inArray(districts.oldId, uniqueDistrictOldIds),
  });

  // create a map for O(1) lookups
  const districtMap = new Map(districtRecords.map((d) => [d.oldId, d.id]));

  // map villages with district IDs
  return villagesList.map((village) => {
    const oldDistrictId = Number(village.district_id);
    const districtId = districtMap.get(oldDistrictId);

    if (!districtId) {
      throw new Error(`District with oldId ${oldDistrictId} not found`);
    }

    return {
      oldId: Number(village.id),
      districtId,
      oldDistrictId,
      name: village.name,
    };
  });
};

const insertInBatches = async (data: InsertVillage[]) => {
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const batch = data.slice(start, end);

    await db.insert(villages).values(batch).execute();

    console.log(
      `📦 Inserted batch ${i + 1}/${totalBatches} (${batch.length} villages)`,
    );
  }
};

async function seedVillages() {
  try {
    console.log("🌱 Starting village seeding...");

    const villagesData = await generateVillages();
    console.log(`📊 Total villages to seed: ${villagesData.length}`);

    await db.delete(villages).execute();
    console.log("🗑️  Cleared existing villages");

    await insertInBatches(villagesData);

    console.log("✅ Villages have been seeded successfully");
  } catch (error) {
    // console.error("❌ Error seeding villages:", error);
    throw error;
  }
}

export default seedVillages;
