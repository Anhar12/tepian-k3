import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { createMockUserAndCompany } from "../helpers/fixtures";
import { Effect } from "effect";
import orderQueries from "../../pengujian/order.queries";
import { order } from "@tepian-k3/db/schema";
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

describe("orderQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getOrderById", () => {
    it("should retrieve an order by ID and userId", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "100",
        status: "pending",
        approvalStatus: "pending",
        paymentStatus: "unpaid",
      });

      const result = await Effect.runPromise(
        orderQueries.getOrderById(orderId, userId)
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(orderId);
      expect(result?.orderNumber).toBe(`ORD-${orderId.substring(0, 8)}`);
      expect(result?.userId).toBe(userId);
    });

    it("should fail to retrieve an order if userId does not match", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      const wrongUserId = uuidv7();

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "200",
        status: "pending",
        approvalStatus: "pending",
        paymentStatus: "unpaid",
      });

      const result = await Effect.runPromise(
        orderQueries.getOrderById(orderId, wrongUserId)
      );

      expect(result).toBeFalsy();
    });
    
    it("should return undefined if order ID does not exist", async () => {
      const { userId } = await createMockUserAndCompany(mockDb);
      const nonExistentId = uuidv7();

      const result = await Effect.runPromise(
        orderQueries.getOrderById(nonExistentId, userId)
      );

      expect(result).toBeFalsy();
    });
  });
});
