import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import parameterToolQueries from "../../pengujian/parameter-tool.queries";
import { clusters, parameterCategories, parameters, tools, parameterTools, toolCodes } from "@tepian-k3/db/schema";

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

describe("parameterToolQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllToolsByParameterId", () => {
    it("should return list of tools for a parameter", async () => {
      const clusterId = uuidv7();
      await mockDb.insert(clusters).values({
        id: clusterId,
        name: `Test Cluster ${clusterId}`,
        acronym: "TC",
      });

      const categoryId = uuidv7();
      await mockDb.insert(parameterCategories).values({
        id: categoryId,
        clusterId,
        name: `Test Category ${categoryId}`,
      });

      const parameterId = uuidv7();
      await mockDb.insert(parameters).values({
        id: parameterId,
        parameterCategoryId: categoryId,
        name: "Test Parameter",
        price: 1000,
        unit: "mg/L",
      });

      const toolCodeId = uuidv7();
      await mockDb.insert(toolCodes).values({
        id: toolCodeId,
        code: "TC",
        description: "Test Tool Name",
      });

      const toolId = uuidv7();
      await mockDb.insert(tools).values({
        id: toolId,
        toolCodeId: toolCodeId,
        toolUniqueCode: "TUC123",
        toolName: "Test Tool",
        availability: "ready",
        condition: "baik",
        brand: "Brand",
        type: "Type",
        serialNumber: "SN",
        stock: 10,
        price: 1000,
      });

      const paramToolId = uuidv7();
      await mockDb.insert(parameterTools).values({
        id: paramToolId,
        parameterId,
        toolId,
      });

      const toolsList = await Effect.runPromise(
        parameterToolQueries.getAllToolsByParameterId(parameterId)
      );

      expect(toolsList).toBeDefined();
      expect(toolsList.length).toBeGreaterThanOrEqual(1);
      const pt = toolsList.find((t: any) => t.id === paramToolId);
      expect(pt).toBeDefined();
      expect(pt?.toolId).toBe(toolId);
    });
  });

  describe("getParameterToolById", () => {
    it("should return a parameter tool by id", async () => {
      const clusterId = uuidv7();
      await mockDb.insert(clusters).values({
        id: clusterId,
        name: `Test Cluster ${clusterId}`,
        acronym: "TC",
      });

      const categoryId = uuidv7();
      await mockDb.insert(parameterCategories).values({
        id: categoryId,
        clusterId,
        name: `Test Category ${categoryId}`,
      });

      const parameterId = uuidv7();
      await mockDb.insert(parameters).values({
        id: parameterId,
        parameterCategoryId: categoryId,
        name: "Test Parameter",
        price: 1000,
        unit: "mg/L",
      });

      const toolCodeId = uuidv7();
      await mockDb.insert(toolCodes).values({
        id: toolCodeId,
        code: "TC2",
        description: "Test Tool Name 2",
      });

      const toolId = uuidv7();
      await mockDb.insert(tools).values({
        id: toolId,
        toolCodeId: toolCodeId,
        toolUniqueCode: "TUC456",
        toolName: "Test Tool 2",
        availability: "ready",
        condition: "baik",
        brand: "Brand",
        type: "Type",
        serialNumber: "SN",
        stock: 10,
        price: 1000,
      });

      const paramToolId = uuidv7();
      await mockDb.insert(parameterTools).values({
        id: paramToolId,
        parameterId,
        toolId,
      });

      const pt = await Effect.runPromise(
        parameterToolQueries.getParameterToolById(paramToolId)
      );

      expect(pt).toBeDefined();
      expect(pt?.id).toBe(paramToolId);
      expect(pt?.parameterId).toBe(parameterId);
      expect(pt?.toolId).toBe(toolId);
    });
  });
});
