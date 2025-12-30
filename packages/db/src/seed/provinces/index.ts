import { db } from "../../client";
import { provinces } from "../../schema";
import { getIndonesianProvinces } from "../utils/indonesian-countries/index";

type InsertProvince = typeof provinces.$inferInsert;

const generateProvinces = async (): Promise<InsertProvince[]> => {
  const provinces = await getIndonesianProvinces();

  return provinces.map((province) => ({
    oldId: Number(province.id),
    name: province.name,
  }));
};

async function seedProvinces() {
  const provincesData = await generateProvinces();

  await db.delete(provinces).execute(); // Hapus semua data yang ada sebelum melakukan seed ulang

  await db.insert(provinces).values(provincesData).execute();
  console.log("✅ Provinces have been seeded");
}

export default seedProvinces;
