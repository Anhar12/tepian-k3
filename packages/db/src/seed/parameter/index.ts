import { inArray } from "drizzle-orm";
import { db } from "../../client";
import { parameters } from "../../schema";
import { getParameters } from "../utils/parameter";

type InsertParameter = typeof parameters.$inferInsert;

export const generateParameters = async (): Promise<InsertParameter[]> => {
  const parametersList = await getParameters();

  // extract unique parameter kategori names
  const uniqueKategoriNames = [
    ...new Set(parametersList.map((p) => p.kategoriParameter)),
  ];

  // fetch all parameter clusters in a single query
  const kategoriRecords = await db.query.parameterCategories.findMany({
    where: inArray(parameters.name, uniqueKategoriNames),
  });

  // create a map for O(1) lookups
  const kategoriMap = new Map(kategoriRecords.map((c) => [c.name, c.id]));

  return parametersList.map((parameter) => {
    const kategoriName = parameter.kategoriParameter;
    const categoryId = kategoriMap.get(kategoriName);

    if (!categoryId) {
      throw new Error(`Parameter Category with name ${kategoriName} not found`);
    }

    return {
      name: parameter.parameter,
      parameterCategoryId: categoryId,
      price: parameter.harga,
      unit: parameter.satuan,
      reference: "test reference",
    };
  });
};

async function seedParameters() {
  const parametersData = await generateParameters();

  await db.delete(parameters).execute(); // Hapus semua data yang ada sebelum melakukan seed ulang

  await db.insert(parameters).values(parametersData).execute();
  console.log("✅ Parameters have been seeded");
}

export default seedParameters;
