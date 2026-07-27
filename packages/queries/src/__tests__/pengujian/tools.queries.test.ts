import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import toolsQueries from "../../pengujian/tools.queries";
import { toolCodes, tools } from "@tepian-k3/db/schema";
import { createMockTool } from "../helpers/fixtures";
import { TRPCError } from "@trpc/server";

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

vi.mock("@tepian-k3/services/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe("toolsQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getToolById", () => {
    it("should return a tool by id", async () => {
      const { toolId } = await createMockTool(mockDb);

      const t = await Effect.runPromise(
        toolsQueries.getToolById(toolId)
      );

      expect(t).toBeDefined();
      expect(t?.id).toBe(toolId);
      expect(t?.toolName).toBe("Test Tool");
    });

    it("should throw for non-existent tool", async () => {
      const nonExistentId = uuidv7();
      const promise = Effect.runPromise(
        toolsQueries.getToolById(nonExistentId)
      );
      await expect(promise).rejects.toThrow();
    });
  });

  describe("getAllUnassignedTools", () => {
    it("should retrieve all unassigned tools", async () => {
      const { toolId } = await createMockTool(mockDb);
      const result = await Effect.runPromise(
        toolsQueries.getAllUnassignedTools()
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((t: any) => t.id === toolId)).toBe(true);
    });
  });

  describe("createTool", () => {
    it("should create a new tool", async () => {
      const tcId = uuidv7();
      await mockDb.insert(toolCodes).values({
        id: tcId,
        code: `TC-NEW`,
        isActive: true,
      });

      const newTool = await Effect.runPromise(
        toolsQueries.createTool({
          toolCodeId: tcId,
          toolUniqueCode: "UNIQUE-CODE",
          toolName: "New Tool",
          brand: "BrandX",
          type: "TypeY",
          function: "Testing",
          availability: "ready",
          condition: "baik",
        })
      );

      expect(newTool).toBeDefined();
      expect(newTool.toolName).toBe("New Tool");
      expect(newTool.toolUniqueCode).toBe("UNIQUE-CODE");
    });
  });
});
