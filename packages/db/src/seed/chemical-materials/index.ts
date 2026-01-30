import { inArray } from "drizzle-orm";
import { db } from "../../client";
import {
  chemicalMaterials,
  parameters,
  parameterChemicalMaterials,
} from "../../schema";
import { getChemicalMaterials } from "../utils/chemical-materials";

type InsertChemicalMaterial = typeof chemicalMaterials.$inferInsert;
type InsertParameterChemicalMaterial =
  typeof parameterChemicalMaterials.$inferInsert;

export const generateChemicalMaterials = async (): Promise<{
  chemicalMaterialsData: InsertChemicalMaterial[];
  parameterChemicalMaterialsData: { code: string; parameterNames: string[] }[];
}> => {
  const chemicalMaterialsList = await getChemicalMaterials();

  const chemicalMaterialsData: InsertChemicalMaterial[] =
    chemicalMaterialsList.map((material) => ({
      code: material.code,
      catalogNumber: material.catalogNumber,
      chemicalFormula: material.chemicalFormula,
      name: material.name,
      usedStock: material.usedStock,
      usedStockUnit: material.usedStockUnit,
      sealedStock: material.sealedStock,
      sealedStockUnit: material.sealedStockUnit,
      monthlyUsage: material.monthlyUsage,
      monthlyUsageUnit: material.monthlyUsageUnit,
      remainingUsedMaterial: material.remainingUsedMaterial,
      remainingUsedMaterialUnit: material.remainingUsedMaterialUnit,
      incomingMaterialNote: material.incomingMaterialNote,
      expiredDate: material.expiredDate,
      status: material.status,
    }));

  const parameterChemicalMaterialsData = chemicalMaterialsList.map(
    (material) => ({
      code: material.code,
      parameterNames: material.parameters,
    }),
  );

  return { chemicalMaterialsData, parameterChemicalMaterialsData };
};

async function seedChemicalMaterials() {
  const { chemicalMaterialsData, parameterChemicalMaterialsData } =
    await generateChemicalMaterials();

  // Delete existing parameter_chemical_materials and chemical_materials
  await db.delete(parameterChemicalMaterials).execute();
  await db.delete(chemicalMaterials).execute();

  // Insert chemical materials
  const insertedMaterials = await db
    .insert(chemicalMaterials)
    .values(chemicalMaterialsData)
    .returning();
  console.log(
    `✅ ${insertedMaterials.length} Chemical Materials have been seeded`,
  );

  // Create a map of code to chemicalMaterialId
  const codeToId = new Map(insertedMaterials.map((m) => [m.code, m.id]));

  // Get all unique parameter names from the material mappings
  const allParameterNames = [
    ...new Set(
      parameterChemicalMaterialsData.flatMap((pm) => pm.parameterNames),
    ),
  ];

  // Fetch all parameters in a single query
  const parameterRecords = await db.query.parameters.findMany({
    where: inArray(parameters.name, allParameterNames),
  });

  // Create a map of parameter name to parameterId
  const parameterNameToId = new Map(
    parameterRecords.map((p) => [p.name, p.id]),
  );

  // Build parameter_chemical_materials data
  const parameterChemicalMaterialsInsertData: InsertParameterChemicalMaterial[] =
    [];

  for (const { code, parameterNames } of parameterChemicalMaterialsData) {
    const chemicalMaterialId = codeToId.get(code);
    if (!chemicalMaterialId) {
      console.warn(
        `⚠️ Chemical material with code ${code} not found, skipping...`,
      );
      continue;
    }

    for (const parameterName of parameterNames) {
      const parameterId = parameterNameToId.get(parameterName);
      if (!parameterId) {
        console.warn(
          `⚠️ Parameter "${parameterName}" not found for chemical material ${code}, skipping...`,
        );
        continue;
      }

      parameterChemicalMaterialsInsertData.push({
        chemicalMaterialId,
        parameterId,
      });
    }
  }

  // Insert parameter_chemical_materials
  if (parameterChemicalMaterialsInsertData.length > 0) {
    await db
      .insert(parameterChemicalMaterials)
      .values(parameterChemicalMaterialsInsertData)
      .execute();
    console.log(
      `✅ ${parameterChemicalMaterialsInsertData.length} Parameter-Chemical Material relationships have been seeded`,
    );
  }
}

export default seedChemicalMaterials;
