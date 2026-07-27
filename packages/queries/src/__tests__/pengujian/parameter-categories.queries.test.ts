import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import parameterCategoriesQueries from "../../pengujian/parameter-categories.queries";
import { clusters, parameterCategories } from "@tepian-k3/db/schema";
import { createMockCluster } from "../helpers/fixtures";

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

describe("parameterCategoriesQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllParameterCategories", () => {
    it("should return list of parameter categories", async () => {
      const { clusterId, categoryId } = await createMockCluster(mockDb);

      const categories = await Effect.runPromise(
        parameterCategoriesQueries.getAllParameterCategories()
      );

      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThanOrEqual(1);
      const cat = categories.find((c: any) => c.id === categoryId);
      expect(cat).toBeDefined();
      expect(cat?.name).toBe(`Test Category ${categoryId}`);
    });
  });

  describe("getParameterCategoryById", () => {
    it("should return a parameter category by id", async () => {
      const { clusterId, categoryId } = await createMockCluster(mockDb);

      const category = await Effect.runPromise(
        parameterCategoriesQueries.getParameterCategoryById(categoryId)
      );

      expect(category).toBeDefined();
      expect(category?.id).toBe(categoryId);
    });

    it("should return undefined for non-existent category", async () => {
      const nonExistentId = uuidv7();
      const category = await Effect.runPromise(
        parameterCategoriesQueries.getParameterCategoryById(nonExistentId)
      );
      expect(category).toBeFalsy();
    });
  });
});
