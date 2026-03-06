import { db } from "../../client";
import { districts } from "../../schema";
import { getIndonesianDistricts } from "../utils/indonesian-countries/index";

const BATCH_SIZE = 1000;

/**
 * Seeds all Indonesian districts using the regency code → UUID map
 * returned by the regency seeder. Returns a district code → UUID map
 * for use by the village seeder.
 *
 * @param regencyMap - Map of full regency BPS code to UUID (from seedRegencies)
 * @returns Map of full district BPS code (e.g. "1101010") to inserted UUID
 */
async function seedDistricts(
  regencyMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log("🌱 Starting district seeding...");

  const districtsList = await getIndonesianDistricts();
  console.log(`📊 Total districts to seed: ${districtsList.length}`);

  await db.delete(districts).execute();
  console.log("🗑️  Cleared existing districts");

  const data = districtsList.map((d) => {
    const regencyId = regencyMap.get(d.regencyCode);
    if (!regencyId) {
      throw new Error(
        `Regency UUID not found for code "${d.regencyCode}" (district: ${d.name})`,
      );
    }
    return { name: d.name, regencyId };
  });

  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const batch = data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    await db.insert(districts).values(batch).execute();
    console.log(
      `📦 Inserted batch ${i + 1}/${totalBatches} (${batch.length} districts)`,
    );
  }

  // Build code → UUID map by matching name + regencyId
  const inserted = await db.query.districts.findMany();
  const nameRegToUuid = new Map(
    inserted.map((d) => [`${d.name}:${d.regencyId}`, d.id]),
  );

  const codeToUuid = new Map(
    districtsList.map((d) => {
      const regencyId = regencyMap.get(d.regencyCode)!;
      const uuid = nameRegToUuid.get(`${d.name}:${regencyId}`);
      if (!uuid) {
        throw new Error(
          `District UUID not found after insert for "${d.name}" in regency "${d.regencyCode}"`,
        );
      }
      return [d.code, uuid] as const;
    }),
  );

  console.log("✅ Districts have been seeded successfully");
  return codeToUuid;
}

export default seedDistricts;
