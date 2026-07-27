import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { pengujianExcelQueries } from "../../pengujian/pengujian-excel.queries";
import { toolCodes } from "@tepian-k3/db/schema";

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

// Mock auditQueries to prevent errors during import testing
vi.mock("../../platform/audit.queries", () => {
  return {
    default: {
      createAuditLog: vi.fn(() => Effect.succeed(true)),
    },
  };
});

describe("pengujianExcelQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("exportAllData", () => {
    it("should export master data for excel", async () => {
      // Create some dummy tool code for export test
      const id = uuidv7();
      await mockDb.insert(toolCodes).values({
        id,
        code: `EX-${id}`,
        description: `Export Tool ${id}`,
        isActive: true,
      });

      const data = await Effect.runPromise(
        pengujianExcelQueries.exportAllData()
      );

      expect(data).toBeDefined();
      expect(data.kategoriData).toBeDefined();
      expect(data.parameterData).toBeDefined();
      expect(data.kodeAlatData).toBeDefined();
      expect(data.alatData).toBeDefined();
      expect(data.bahanData).toBeDefined();
      
      const tc = data.kodeAlatData.find((t: any) => t.kode === `EX-${id}`);
      expect(tc).toBeDefined();
      expect(tc?.deskripsi).toBe(`Export Tool ${id}`);
    });
  });
});
