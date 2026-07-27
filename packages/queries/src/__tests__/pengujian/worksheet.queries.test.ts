import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { createMockUserAndCompany } from "../helpers/fixtures";
import { Effect } from "effect";
import worksheetQueries from "../../pengujian/worksheet.queries";
import { order, worksheets } from "@tepian-k3/db/schema";
import { v7 as uuidv7 } from "uuid";

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
  logError: vi.fn((ctx, msg, meta) => {
    console.error(ctx, msg, meta?.error);
  }),
  logInfo: vi.fn(),
}));

describe("worksheetQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getWorksheetById", () => {
    it("should retrieve a worksheet by ID with its relations", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      const worksheetId = uuidv7();

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `WS-${orderId.substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "100",
        status: "pending",
        approvalStatus: "pending",
        paymentStatus: "unpaid",
      });

      await mockDb.insert(worksheets).values({
        id: worksheetId,
        orderId,
        status: "draft",
        createdBy: userId,
      });

      const result = await Effect.runPromise(
        worksheetQueries.getWorksheetById(worksheetId)
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(worksheetId);
      expect(result?.orderId).toBe(orderId);
      expect(result?.order?.orderNumber).toBe(`WS-${orderId.substring(0, 8)}`);
    });

    it("should return undefined if worksheet does not exist", async () => {
      const nonExistentId = uuidv7();
      const result = await Effect.runPromise(
        worksheetQueries.getWorksheetById(nonExistentId)
      );
      expect(result).toBeFalsy();
    });
  });

  describe("createWorksheetFromOrder", () => {
    it("should fail if order not found", async () => {
      const promise = Effect.runPromise(
        worksheetQueries.createWorksheetFromOrder(uuidv7(), uuidv7())
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should fail if worksheet already exists", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      
      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${uuidv7().substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "100",
      });

      await mockDb.insert(worksheets).values({
        id: uuidv7(),
        orderId,
        status: "draft",
        createdBy: userId,
      });

      const promise = Effect.runPromise(
        worksheetQueries.createWorksheetFromOrder(orderId, userId)
      );
      
      await expect(promise).rejects.toThrowError(/Worksheet sudah dibuat untuk order ini/);
    });
  });

  describe("createWorksheetEstimates", () => {
    it("should fail if worksheet not found", async () => {
      const promise = Effect.runPromise(
        worksheetQueries.createWorksheetEstimates(uuidv7(), 2, 5, uuidv7())
      );
      
      await expect(promise).rejects.toThrowError(/Worksheet tidak ditemukan/);
    });

    it("should fail if worksheet is not in draft or revision", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      const worksheetId = uuidv7();

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${uuidv7().substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "100",
      });

      await mockDb.insert(worksheets).values({
        id: worksheetId,
        orderId,
        status: "verified",
        createdBy: userId,
      });

      const promise = Effect.runPromise(
        worksheetQueries.createWorksheetEstimates(worksheetId, 2, 5, userId)
      );
      
      await expect(promise).rejects.toThrowError(/Estimasi hanya dapat ditambahkan pada worksheet dengan status 'draft' atau 'revision'/);
    });
  });
});
