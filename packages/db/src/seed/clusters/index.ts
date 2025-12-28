import { db } from "../../client";
import { clusters } from "../../schema";

type InsertCluster = typeof clusters.$inferInsert;

const generateClusters = (): InsertCluster[] => {
  const clusters: string[] = [
    "Faktor Fisika",
    "Faktor Kimia",
    "Faktor Mikrobiologi",
    "Faktor Kesehatan",
    "KUDR",
    "Pengujian Lain",
    "Keselamatan",
  ];

  return clusters.map((name) => ({ name }));
};

async function seedClusters() {
  const clustersData = generateClusters();

  await db.delete(clusters).execute(); // Hapus semua data yang ada sebelum melakukan seed ulang

  await db.insert(clusters).values(clustersData).execute();

  console.log("✅ Clusters have been seeded");
}

export default seedClusters;
