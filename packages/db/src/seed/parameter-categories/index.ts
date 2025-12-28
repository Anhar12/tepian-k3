import { db } from "../../client";
import { parameterCategories } from "../../schema";

type InsertParameterCategory = typeof parameterCategories.$inferInsert;

const generateParameterCategories = async (): Promise<
  InsertParameterCategory[]
> => {
  const lingkunganHidupId = await db.query.clusters.findFirst({
    where: (clusters, { eq }) => eq(clusters.name, "Lingkungan Hidup"),
    columns: { id: true },
  });

  const lingkunganKerjaId = await db.query.clusters.findFirst({
    where: (clusters, { eq }) => eq(clusters.name, "Lingkungan Kerja"),
    columns: { id: true },
  });

  const keselamatanKerjaId = await db.query.clusters.findFirst({
    where: (clusters, { eq }) => eq(clusters.name, "Keselamatan Kerja"),
    columns: { id: true },
  });

  const kesehatanKerjaId = await db.query.clusters.findFirst({
    where: (clusters, { eq }) => eq(clusters.name, "Kesehatan Kerja"),
    columns: { id: true },
  });

  const biomarkerId = await db.query.clusters.findFirst({
    where: (clusters, { eq }) => eq(clusters.name, "Biomarker"),
    columns: { id: true },
  });

  if (
    !lingkunganHidupId ||
    !lingkunganKerjaId ||
    !keselamatanKerjaId ||
    !kesehatanKerjaId ||
    !biomarkerId
  ) {
    throw new Error("Required clusters not found. Please seed clusters first.");
  }

  const categories: {
    name: string;
    clusterId: string;
  }[] = [
    {
      name: "Faktor Fisika",
      clusterId: lingkunganKerjaId.id,
    },
    {
      name: "Faktor Kimia",
      clusterId: lingkunganHidupId.id,
    },
    {
      name: "Faktor Mikrobiologi",
      clusterId: lingkunganKerjaId.id,
    },
    {
      name: "Faktor Kesehatan",
      clusterId: kesehatanKerjaId.id,
    },
    {
      name: "KUDR",
      clusterId: lingkunganKerjaId.id,
    },
    {
      name: "Pengujian Lain",
      clusterId: biomarkerId.id,
    },
    {
      name: "Keselamatan",
      clusterId: keselamatanKerjaId.id,
    },
  ];

  return categories.map((category) => ({
    name: category.name,
    clusterId: category.clusterId,
  }));
};

async function seedParameterCategories() {
  const parameterCategoriesData = await generateParameterCategories();

  await db.delete(parameterCategories).execute(); // Hapus semua data yang ada sebelum melakukan seed ulang

  await db
    .insert(parameterCategories)
    .values(parameterCategoriesData)
    .execute();

  console.log("✅ Parameter Categories have been seeded");
}

export default seedParameterCategories;
