import { inArray } from "drizzle-orm";
import { db } from "../../client";
import { provinces, regencies } from "../../schema";
import { getIndonesianRegencies } from "../utils/indonesian-countries/index";

type InsertRegency = typeof regencies.$inferInsert;

const BATCH_SIZE = 1000; // Adjust based on your needs

const generateRegencies = async (): Promise<InsertRegency[]> => {
  const regenciesList = await getIndonesianRegencies();

  // Extract unique province IDs
  const uniqueProvinceOldIds = [
    ...new Set(regenciesList.map((r) => Number(r.province_id))),
  ];

  // Fetch all provinces in a single query
  const provinceRecords = await db.query.provinces.findMany({
    where: inArray(provinces.oldId, uniqueProvinceOldIds),
  });

  // Create a map for O(1) lookups
  const provinceMap = new Map(provinceRecords.map((p) => [p.oldId, p.id]));

  // Map regencies with province IDs
  return regenciesList.map((regency) => {
    const oldProvinceId = Number(regency.province_id);
    const provinceId = provinceMap.get(oldProvinceId);

    if (!provinceId) {
      throw new Error(`Province with oldId ${oldProvinceId} not found`);
    }

    return {
      oldId: Number(regency.id),
      provinceId,
      oldProvinceId,
      name: regency.name,
    };
  });
};

const insertInBatches = async (data: InsertRegency[]) => {
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const batch = data.slice(start, end);

    await db.insert(regencies).values(batch).execute();

    console.log(
      `📦 Inserted batch ${i + 1}/${totalBatches} (${batch.length} regencies)`
    );
  }
};

async function seedRegencies() {
  try {
    console.log("🌱 Starting regency seeding...");

    const regenciesData = await generateRegencies();
    console.log(`📊 Total regencies to seed: ${regenciesData.length}`);

    await db.delete(regencies).execute();
    console.log("🗑️  Cleared existing regencies");

    await insertInBatches(regenciesData);

    console.log("✅ Regencies have been seeded successfully");
  } catch (error) {
    // console.error("❌ Error seeding regencies:", error);
    throw error;
  }
}

export default seedRegencies;
