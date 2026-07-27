import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import chemicalMaterialQueries from "../../pengujian/chemical-material.queries";
import { chemicalMaterials } from "@tepian-k3/db/schema";

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

describe("chemicalMaterialQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllChemicalMaterials", () => {
    it("should return list of chemical materials", async () => {
      const chemicalMaterialId = uuidv7();
      await mockDb.insert(chemicalMaterials).values({
        id: chemicalMaterialId,
        code: `CM-${chemicalMaterialId.substring(0, 5)}`,
        name: "Test Chemical",
        usedStockUnit: "gram",
        sealedStockUnit: "botol",
        monthlyUsageUnit: "ml",
        remainingUsedMaterialUnit: "gram"
      });

      const cmList = await Effect.runPromise(
        chemicalMaterialQueries.getAllChemicalMaterials()
      );

      expect(cmList).toBeDefined();
      expect(cmList.length).toBeGreaterThanOrEqual(1);
      const cm = cmList.find((c: any) => c.id === chemicalMaterialId);
      expect(cm).toBeDefined();
      expect(cm?.name).toBe("Test Chemical");
    });
  });

  describe("getChemicalMaterialById", () => {
    it("should return a chemical material by id", async () => {
      const chemicalMaterialId = uuidv7();
      await mockDb.insert(chemicalMaterials).values({
        id: chemicalMaterialId,
        code: `CM-${chemicalMaterialId.substring(0, 5)}`,
        name: "Test Chemical 2",
        usedStockUnit: "gram",
        sealedStockUnit: "botol",
        monthlyUsageUnit: "ml",
        remainingUsedMaterialUnit: "gram"
      });

      const cm = await Effect.runPromise(
        chemicalMaterialQueries.getChemicalMaterialById(chemicalMaterialId)
      );

      expect(cm).toBeDefined();
      expect(cm?.id).toBe(chemicalMaterialId);
      expect(cm?.name).toBe("Test Chemical 2");
    });

    it("should return undefined for non-existent chemical material", async () => {
      const nonExistentId = uuidv7();
      const promise = Effect.runPromise(
        chemicalMaterialQueries.getChemicalMaterialById(nonExistentId)
      );
      await expect(promise).rejects.toThrow();
    });
  });
});
