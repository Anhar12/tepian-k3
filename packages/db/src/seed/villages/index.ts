import { db } from "../../client";
import { villages } from "../../schema";
import { getIndonesianVillages } from "../utils/indonesian-countries/index";

const BATCH_SIZE = 1000;

/**
 * Seeds all Indonesian villages using the district code → UUID map
 * returned by the district seeder.
 *
 * @param districtMap - Map of full district BPS code to UUID (from seedDistricts)
 */
async function seedVillages(districtMap: Map<string, string>): Promise<void> {
  console.log("🌱 Starting village seeding...");

  const villagesList = await getIndonesianVillages();
  console.log(`📊 Total villages to seed: ${villagesList.length}`);

  await db.delete(villages).execute();
  console.log("🗑️  Cleared existing villages");

  const data = villagesList.map((v) => {
    const districtId = districtMap.get(v.districtCode);
    if (!districtId) {
      throw new Error(
        `District UUID not found for code "${v.districtCode}" (village: ${v.name})`,
      );
    }
    return { name: v.name, districtId };
  });

  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const batch = data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    await db.insert(villages).values(batch).execute();
    console.log(
      `📦 Inserted batch ${i + 1}/${totalBatches} (${batch.length} villages)`,
    );
  }

  console.log("✅ Villages have been seeded successfully");
}

export default seedVillages;
