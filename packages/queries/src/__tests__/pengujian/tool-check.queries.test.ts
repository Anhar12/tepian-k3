import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import toolCheckQueries from "../../pengujian/tool-check.queries";
import { toolChecks, tools, toolCodes, userCompanies, users } from "@tepian-k3/db/schema";
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

// Mock logger
vi.mock("@tepian-k3/services/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

const mockEmployeeId = uuidv7();

// Mock employeeQueries
vi.mock("../../platform/employee.queries", () => ({
  default: {
    getEmployeeByUserId: vi.fn((userId) => {
      // Mock an employee returning if it's the valid one
      return Effect.succeed({
        id: mockEmployeeId,
        userId,
        name: "Test Employee",
      });
    }),
  }
}));

// Mock getOffsetPaginated
vi.mock("../utils/get-offset-paginated", () => ({
  getOffsetPaginated: vi.fn(() => Effect.succeed({
    data: [{ id: "mock-id" }],
    pageCount: 1,
  })),
}));

describe("toolCheckQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  const createMockTool = async (db: any) => {
    const toolCodeId = uuidv7();
    await db.insert(toolCodes).values({
      id: toolCodeId,
      code: "TC-CHECK",
      description: "Test Check Tool",
    });

    const toolId = uuidv7();
    await db.insert(tools).values({
      id: toolId,
      toolCodeId,
      toolUniqueCode: "TUC-CHECK",
      toolName: "Check Tool",
      availability: "ready",
      condition: "baik",
      brand: "Brand X",
      stock: 1,
      price: 100,
    });
    
    return toolId;
  };

  describe("getAllToolChecks", () => {
    it("should get all tool checks for a tool", async () => {
      const toolId = await createMockTool(mockDb);
      const checkId = uuidv7();
      
      await mockDb.insert(toolChecks).values({
        id: checkId,
        toolId,
        checkedBy: mockEmployeeId,
        checkAlatMenyala: true,
        checkPenyimpangan: true,
        checkKelengkapanAlat: true,
        checkKondisiFisikAlat: true,
        checkConditionResult: "baik",
              });

      const result = await Effect.runPromise(toolCheckQueries.getAllToolChecks(toolId));
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]?.checkConditionResult).toBe("baik");
    });
  });

  describe("getToolCheckById", () => {
    it("should get tool check by id", async () => {
      const toolId = await createMockTool(mockDb);
      const checkId = uuidv7();
      
      await mockDb.insert(toolChecks).values({
        id: checkId,
        toolId,
        checkedBy: mockEmployeeId,
        checkAlatMenyala: true,
        checkPenyimpangan: true,
        checkKelengkapanAlat: true,
        checkKondisiFisikAlat: true,
        checkConditionResult: "baik",
              });

      const result = await Effect.runPromise(toolCheckQueries.getToolCheckById(checkId));
      expect(result).toBeDefined();
      expect(result?.id).toBe(checkId);
      expect(result?.toolId).toBe(toolId);
    });
    
    it("should return undefined if check does not exist", async () => {
      const result = await Effect.runPromise(toolCheckQueries.getToolCheckById(uuidv7()));
      expect(result).toBeFalsy();
    });
  });

  describe("createToolCheck", () => {
    it("should create new tool check and sync tool status to ready if baik", async () => {
      const toolId = await createMockTool(mockDb);
      const userId = uuidv7();
      
      const result = await Effect.runPromise(
        toolCheckQueries.createToolCheck(userId, {
          toolId,
          checkConditionResult: "baik",
          checkAlatMenyala: true,
          checkPenyimpangan: false,
          checkKelengkapanAlat: true,
          checkKondisiFisikAlat: true,
        })
      );
      
      expect(result).toBeDefined();
      expect(result.toolId).toBe(toolId);
            
      // Verify tool condition is updated
      const updatedTool = await mockDb.query.tools.findFirst({ where: (t: any, { eq }: any) => eq(t.id, toolId) });
      expect(updatedTool.condition).toBe("baik");
      expect(updatedTool.availability).toBe("ready");
    });

    it("should create new tool check and sync tool status to not_ready if rusak", async () => {
      const toolId = await createMockTool(mockDb);
      const userId = uuidv7();
      
      const result = await Effect.runPromise(
        toolCheckQueries.createToolCheck(userId, {
          toolId,
          checkConditionResult: "rusak",
          checkAlatMenyala: false,
          checkPenyimpangan: true,
          checkKelengkapanAlat: false,
          checkKondisiFisikAlat: false,
        })
      );
      
      expect(result).toBeDefined();
      expect(result.checkConditionResult).toBe("rusak");
      
      // Verify tool condition is updated
      const updatedTool = await mockDb.query.tools.findFirst({ where: (t: any, { eq }: any) => eq(t.id, toolId) });
      expect(updatedTool.condition).toBe("rusak");
      expect(updatedTool.availability).toBe("not_ready");
    });
    
    it("should fail if tool does not exist", async () => {
      const promise = Effect.runPromise(
        toolCheckQueries.createToolCheck(uuidv7(), {
          toolId: uuidv7(),
          checkAlatMenyala: true,
          checkPenyimpangan: true,
          checkKelengkapanAlat: true,
          checkKondisiFisikAlat: true,
          checkConditionResult: "baik",
        })
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("updateToolCheck", () => {
    it("should update tool check and sync tool status", async () => {
      const toolId = await createMockTool(mockDb);
      const checkId = uuidv7();
      
      await mockDb.insert(toolChecks).values({
        id: checkId,
        toolId,
        checkedBy: mockEmployeeId,
        checkAlatMenyala: true,
        checkPenyimpangan: true,
        checkKelengkapanAlat: true,
        checkKondisiFisikAlat: true,
        checkConditionResult: "baik",
              });

      const updated = await Effect.runPromise(
        toolCheckQueries.updateToolCheck({
          id: checkId,
          checkConditionResult: "rusak",
                  })
      );

      expect(updated).toBeDefined();
      expect(updated.checkConditionResult).toBe("rusak");
            
      // Verify tool condition is updated
      const updatedTool = await mockDb.query.tools.findFirst({ where: (t: any, { eq }: any) => eq(t.id, toolId) });
      expect(updatedTool.condition).toBe("rusak");
      expect(updatedTool.availability).toBe("not_ready");
    });

    it("should fail to update non-existent tool check", async () => {
      const promise = Effect.runPromise(
        toolCheckQueries.updateToolCheck({
          id: uuidv7(),
          checkConditionResult: "baik",
                  })
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("deleteToolCheck", () => {
    it("should soft delete a tool check", async () => {
      const toolId = await createMockTool(mockDb);
      const checkId = uuidv7();
      
      await mockDb.insert(toolChecks).values({
        id: checkId,
        toolId,
        checkedBy: mockEmployeeId,
        checkAlatMenyala: true,
        checkPenyimpangan: true,
        checkKelengkapanAlat: true,
        checkKondisiFisikAlat: true,
        checkConditionResult: "baik",
              });

      const deleted = await Effect.runPromise(
        toolCheckQueries.deleteToolCheck(checkId)
      );

      expect(deleted).toBeDefined();
      expect(deleted.deletedAt).not.toBeNull();
      
      // Verification using deleted query
      const verify = await Effect.runPromise(
        toolCheckQueries.getDeletedToolCheckById(checkId)
      );
      expect(verify).toBeDefined();
      expect(verify?.id).toBe(checkId);
    });

    it("should fail to delete non-existent tool check", async () => {
      const promise = Effect.runPromise(
        toolCheckQueries.deleteToolCheck(uuidv7())
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("restoreToolCheck", () => {
    it("should restore a deleted tool check", async () => {
      const toolId = await createMockTool(mockDb);
      const checkId = uuidv7();
      
      await mockDb.insert(toolChecks).values({
        id: checkId,
        toolId,
        checkedBy: mockEmployeeId,
        checkAlatMenyala: true,
        checkPenyimpangan: true,
        checkKelengkapanAlat: true,
        checkKondisiFisikAlat: true,
        checkConditionResult: "baik",
                deletedAt: new Date().toISOString(),
      });

      const restored = await Effect.runPromise(
        toolCheckQueries.restoreToolCheck(checkId)
      );

      expect(restored).toBeDefined();
      expect(restored.deletedAt).toBeNull();
    });
  });
});
