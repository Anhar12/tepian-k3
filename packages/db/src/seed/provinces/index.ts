import { db } from "../../client";
import { provinces } from "../../schema";
import { getIndonesianProvinces } from "../utils/indonesian-countries/index";

/**
 * Seeds all Indonesian provinces and returns a BPS code → UUID map
 * for use by the regency seeder.
 *
 * @returns Map of province BPS code (e.g. "11") to inserted UUID
 */
async function seedProvinces(): Promise<Map<string, string>> {
  const provincesList = await getIndonesianProvinces();

  await db.delete(provinces).execute();

  await db
    .insert(provinces)
    .values(provincesList.map((p) => ({ name: p.name })))
    .execute();

  const inserted = await db.query.provinces.findMany();
  const nameToUuid = new Map(inserted.map((r) => [r.name, r.id]));

  const codeToUuid = new Map(
    provincesList.map((p) => [p.code, nameToUuid.get(p.name)!]),
  );

  console.log(`✅ Seeded ${provincesList.length} provinces`);
  return codeToUuid;
}

export default seedProvinces;
