import { db } from "../../client";
import { regencies } from "../../schema";
import { getIndonesianRegencies } from "../utils/indonesian-countries/index";

const BATCH_SIZE = 1000;

/**
 * Seeds all Indonesian regencies using the province code → UUID map
 * returned by the province seeder. Returns a regency code → UUID map
 * for use by the district seeder.
 *
 * @param provinceMap - Map of province BPS code to UUID (from seedProvinces)
 * @returns Map of full regency BPS code (e.g. "1101") to inserted UUID
 */
async function seedRegencies(
  provinceMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log("🌱 Starting regency seeding...");

  const regenciesList = await getIndonesianRegencies();
  console.log(`📊 Total regencies to seed: ${regenciesList.length}`);

  await db.delete(regencies).execute();
  console.log("🗑️  Cleared existing regencies");

  const data = regenciesList.map((r) => {
    const provinceId = provinceMap.get(r.provinceCode);
    if (!provinceId) {
      throw new Error(
        `Province UUID not found for code "${r.provinceCode}" (regency: ${r.name})`,
      );
    }
    return { name: r.name, provinceId };
  });

  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const batch = data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    await db.insert(regencies).values(batch).execute();
    console.log(
      `📦 Inserted batch ${i + 1}/${totalBatches} (${batch.length} regencies)`,
    );
  }

  // Build code → UUID map by matching name + provinceId
  const inserted = await db.query.regencies.findMany();
  const nameProvToUuid = new Map(
    inserted.map((r) => [`${r.name}:${r.provinceId}`, r.id]),
  );

  const codeToUuid = new Map(
    regenciesList.map((r) => {
      const provinceId = provinceMap.get(r.provinceCode)!;
      const uuid = nameProvToUuid.get(`${r.name}:${provinceId}`);
      if (!uuid) {
        throw new Error(
          `Regency UUID not found after insert for "${r.name}" in province "${r.provinceCode}"`,
        );
      }
      return [r.code, uuid] as const;
    }),
  );

  console.log("✅ Regencies have been seeded successfully");
  return codeToUuid;
}

export default seedRegencies;
