import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import orderStatusHistoryQueries from "../../pengujian/order-status-history.queries";
import { order, orderStatusHistory } from "@tepian-k3/db/schema";
import { createMockUserAndCompany } from "../helpers/fixtures";
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
}));

describe("orderStatusHistoryQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  const setupMockData = async () => {
    const { userId, companyId } = await createMockUserAndCompany(mockDb);
    
    // Create order
    const orderId = uuidv7();
    await mockDb.insert(order).values({
      id: orderId,
      orderNumber: `ORD-${orderId.substring(0, 8)}`,
      userId,
      companyId,
      totalAmount: "100",
    });

    return { userId, companyId, orderId };
  };

  describe("getOrderStatusHistoriesByOrderId", () => {
    it("should return empty array when no histories exist", async () => {
      const { orderId } = await setupMockData();
      
      const result = await Effect.runPromise(
        orderStatusHistoryQueries.getOrderStatusHistoriesByOrderId(orderId)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should return order status histories", async () => {
      const { orderId, userId } = await setupMockData();
      
      await mockDb.insert(orderStatusHistory).values({
        id: uuidv7(),
        orderId,
        status: "pending",
        changedBy: userId,
        note: "Initial status",
      });

      const result = await Effect.runPromise(
        orderStatusHistoryQueries.getOrderStatusHistoriesByOrderId(orderId)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.status).toBe("pending");
      expect(result[0]?.note).toBe("Initial status");
    });
  });

  describe("createOrderStatusHistory", () => {
    it("should create order status history successfully", async () => {
      const { orderId, userId } = await setupMockData();
      
      const result = await Effect.runPromise(
        orderStatusHistoryQueries.createOrderStatusHistory(
          mockDb,
          orderId,
          "kaji_ulang_disetujui",
          userId,
          "Approved by admin"
        )
      );
      
      expect(result).toBeDefined();
      expect(result.orderId).toBe(orderId);
      expect(result.status).toBe("kaji_ulang_disetujui");
      expect(result.changedBy).toBe(userId);
      expect(result.note).toBe("Approved by admin");
    });

    it("should fail when database error occurs", async () => {
      const fakeTx = {
        insert: () => ({
          values: () => ({
            returning: () => Promise.reject(new Error("DB Error"))
          })
        })
      };
      
      const promise = Effect.runPromise(
        orderStatusHistoryQueries.createOrderStatusHistory(
          fakeTx as any,
          uuidv7(),
          "pending",
          uuidv7()
        )
      );
      
      await expect(promise).rejects.toThrow();
    });
  });
});
