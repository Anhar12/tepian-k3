import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import toolCodeQueries from "../../pengujian/tool-code.queries";
import { toolCodes } from "@tepian-k3/db/schema";
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

// Mock getOffsetPaginated
vi.mock("../../utils/get-offset-paginated", () => ({
  getOffsetPaginated: vi.fn(() => Effect.succeed({
    data: [{ id: "mock-id" }],
    pageCount: 1,
  })),
}));

describe("toolCodeQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllFlattenedToolCodes", () => {
    it("should return active tool codes", async () => {
      const tcId = uuidv7();
      await mockDb.insert(toolCodes).values({
        id: tcId,
        code: `TC-ACTIVE`,
        isActive: true,
      });

      const codes = await Effect.runPromise(
        toolCodeQueries.getAllFlattenedToolCodes()
      );
      
      expect(codes.length).toBeGreaterThanOrEqual(1);
      expect(codes.some((c: any) => c.id === tcId)).toBe(true);
    });
  });

  describe("getToolCodeById", () => {
    it("should return a tool code by id", async () => {
      const tcId = uuidv7();
      await mockDb.insert(toolCodes).values({
        id: tcId,
        code: `TC-ID-${tcId.substring(0, 5)}`,
        isActive: true,
      });

      const tc = await Effect.runPromise(
        toolCodeQueries.getToolCodeById(tcId)
      );
      
      expect(tc).toBeDefined();
      expect(tc?.id).toBe(tcId);
    });

    it("should throw for non-existent tool code", async () => {
      const promise = Effect.runPromise(
        toolCodeQueries.getToolCodeById(uuidv7())
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("updateToolCode", () => {
    it("should update a tool code", async () => {
      const tcId = uuidv7();
      await mockDb.insert(toolCodes).values({
        id: tcId,
        code: `TC-UPD`,
        isActive: true,
      });

      const updated = await Effect.runPromise(
        toolCodeQueries.updateToolCode({
          id: tcId,
          code: "TEST-UPDATE",
          description: "Updated testing tool code",
          isActive: false,
        })
      );
      
      expect(updated).toBeDefined();
      expect(updated.code).toBe("TEST-UPDATE");
      expect(updated.description).toBe("Updated testing tool code");
      expect(updated.isActive).toBe(false);
    });
  });
});
