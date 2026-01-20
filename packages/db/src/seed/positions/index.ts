import { db } from "../../client";
import { positions } from "../../schema";
import { eq } from "drizzle-orm";

const positionsData: { name: string; description: string }[] = [
  { name: "Kepala Regu", description: "Description for Kepala Regu" },
  { name: "Ketua Regu Kimia", description: "Description for Ketua Regu Kimia" },
  {
    name: "Penguji K3 Ahli Madya",
    description: "Description for Penguji K3 Ahli Madya",
  },
  {
    name: "Penguji K3 Ahli Muda",
    description: "Description for Penguji K3 Ahli Muda",
  },
  {
    name: "Penguji K3 Ahli Pertama",
    description: "Description for Penguji K3 Ahli Pertama",
  },
];

export async function seedPositions() {
  for (const position of positionsData) {
    const existingPosition = await db.query.positions.findFirst({
      where: eq(positions.name, position.name),
    });

    if (!existingPosition) {
      await db.insert(positions).values({
        name: position.name,
        description: position.description,
      });
      console.log(`Inserted position: ${position.name}`);
    }
  }
}
