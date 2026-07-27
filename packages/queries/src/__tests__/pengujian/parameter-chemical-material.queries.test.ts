import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import parameterChemicalMaterialsQueries from "../../pengujian/parameter-chemical-material.queries";
import { chemicalMaterials, parameterChemicalMaterials, clusters, parameterCategories, parameters } from "@tepian-k3/db/schema";
import { createMockParameter } from "../helpers/fixtures";

const { getDb, setDb } = vi.hoisted(() => {
  let _db: any;
  return {
    getDb: () => {
      if (!_db) throw new Error("DB not init");
      return _db;
    },
    setDb: (d: any) => {
      _db = d;
    },
  };
});

vi.mock("@tepian-k3/db/client", () => {
  return {
    get db() {
      return getDb();
    },
  };
});

describe("parameterChemicalMaterialsQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllChemicalMaterialsByParameterId", () => {
    it("should return list of chemical materials for a parameter", async () => {
      const { parameterId } = await createMockParameter(mockDb);

      const chemicalMaterialId = uuidv7();
      await mockDb.insert(chemicalMaterials).values({
        id: chemicalMaterialId,
        code: `CM-${chemicalMaterialId.substring(0, 8)}`,
        name: "Test Chemical",
        usedStockUnit: "gram",
        sealedStockUnit: "botol",
        monthlyUsageUnit: "ml",
        remainingUsedMaterialUnit: "gram"
      });

      const paramChemId = uuidv7();
      await mockDb.insert(parameterChemicalMaterials).values({
        id: paramChemId,
        parameterId,
        chemicalMaterialId,
      });

      const cmList = await Effect.runPromise(
        parameterChemicalMaterialsQueries.getAllChemicalMaterialsByParameterId(parameterId)
      );

      expect(cmList).toBeDefined();
      expect(cmList.length).toBeGreaterThanOrEqual(1);
      const pc = cmList.find((c: any) => c.id === paramChemId);
      expect(pc).toBeDefined();
      expect(pc?.chemicalMaterialId).toBe(chemicalMaterialId);
    });

    it("should return empty array for non-existent parameter", async () => {
      const nonExistentId = uuidv7();
      const materials = await Effect.runPromise(
        parameterChemicalMaterialsQueries.getAllChemicalMaterialsByParameterId(
          nonExistentId
        )
      );
      expect(materials).toEqual([]);
    });
  });

  describe("getParameterChemicalMaterialById", () => {
    it("should return a parameter chemical material by id", async () => {
      const { parameterId } = await createMockParameter(mockDb);

      const chemicalMaterialId = uuidv7();
      await mockDb.insert(chemicalMaterials).values({
        id: chemicalMaterialId,
        code: `CM-${chemicalMaterialId.substring(0, 8)}`,
        name: "Test Chemical 2",
        usedStockUnit: "gram",
        sealedStockUnit: "botol",
        monthlyUsageUnit: "ml",
        remainingUsedMaterialUnit: "gram"
      });

      const paramChemId = uuidv7();
      await mockDb.insert(parameterChemicalMaterials).values({
        id: paramChemId,
        parameterId,
        chemicalMaterialId,
      });

      const pc = await Effect.runPromise(
        parameterChemicalMaterialsQueries.getParameterChemicalMaterialById(paramChemId)
      );

      expect(pc).toBeDefined();
      expect(pc?.id).toBe(paramChemId);
      expect(pc?.parameterId).toBe(parameterId);
      expect(pc?.chemicalMaterialId).toBe(chemicalMaterialId);
    });

    it("should return undefined for non-existent id", async () => {
      const nonExistentId = uuidv7();
      const pc = await Effect.runPromise(
        parameterChemicalMaterialsQueries.getParameterChemicalMaterialById(nonExistentId)
      );
      expect(pc).toBeFalsy();
    });
  });
});
