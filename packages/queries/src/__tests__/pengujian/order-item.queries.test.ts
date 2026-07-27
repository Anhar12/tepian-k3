import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import orderItemQueries from "../../pengujian/order-item.queries";
import { order, orderItem, parameters, parameterCategories, clusters, userCompanyTestingLocation } from "@tepian-k3/db/schema";
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
  logInfo: vi.fn(),
}));

describe("orderItemQueries", () => {
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

    // Create location
    const locationId = uuidv7();
    await mockDb.insert(userCompanyTestingLocation).values({
      id: locationId,
      userCompanyId: companyId,
      userId: userId,
      name: "Test Location",
      regencyId: uuidv7(),
      districtId: uuidv7(),
    });

    // Create cluster, category and parameter
    const clusterId = uuidv7();
    await mockDb.insert(clusters).values({
      id: clusterId,
      name: "Test Cluster",
      acronym: "TC",
    });

    const categoryId = uuidv7();
    await mockDb.insert(parameterCategories).values({
      id: categoryId,
      clusterId,
      name: "Test Category",
    });

    const parameterId = uuidv7();
    await mockDb.insert(parameters).values({
      id: parameterId,
      parameterCategoryId: categoryId,
      name: "Test Parameter",
      price: 1000,
      unit: "mg/L",
    });

    return { userId, companyId, orderId, locationId, parameterId };
  };

  describe("getOrderItemsByOrderId", () => {
    it("should return empty array when no items exist", async () => {
      const { orderId } = await setupMockData();
      
      const result = await Effect.runPromise(
        orderItemQueries.getOrderItemsByOrderId(mockDb, orderId)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should return order items", async () => {
      const { orderId, locationId, parameterId } = await setupMockData();
      
      await mockDb.insert(orderItem).values({
        id: uuidv7(),
        orderId,
        locationId,
        parameterId,
        price: 1000,
        quantity: 2,
        subTotal: 2000,
      });

      const result = await Effect.runPromise(
        orderItemQueries.getOrderItemsByOrderId(mockDb, orderId)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.parameterId).toBe(parameterId);
      expect(result[0]?.locationId).toBe(locationId);
    });
  });

  describe("createOrderItems", () => {
    it("should fail when orderItems is empty", async () => {
      const { orderId } = await setupMockData();
      
      const promise = Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, [])
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should fail when quantity is zero or less", async () => {
      const { orderId, locationId, parameterId } = await setupMockData();
      
      const items = [{
        id: locationId,
        name: "Location",
        items: [{
          parameterId,
          price: 1000,
          quantity: 0
        }]
      }];
      
      const promise = Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, items)
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should fail when duplicate parameters exist in same location", async () => {
      const { orderId, locationId, parameterId } = await setupMockData();
      
      const items = [{
        id: locationId,
        name: "Location",
        items: [
          { parameterId, price: 1000, quantity: 1 },
          { parameterId, price: 1000, quantity: 2 }
        ]
      }];
      
      const promise = Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, items)
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should fail when location does not exist", async () => {
      const { orderId, parameterId } = await setupMockData();
      
      const items = [{
        id: uuidv7(), // non-existent location
        name: "Location",
        items: [
          { parameterId, price: 1000, quantity: 1 }
        ]
      }];
      
      const promise = Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, items)
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should fail when parameter does not exist", async () => {
      const { orderId, locationId } = await setupMockData();
      
      const items = [{
        id: locationId,
        name: "Location",
        items: [
          { parameterId: uuidv7(), price: 1000, quantity: 1 }
        ]
      }];
      
      const promise = Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, items)
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should fail when price mismatches DB", async () => {
      const { orderId, locationId, parameterId } = await setupMockData();
      
      const items = [{
        id: locationId,
        name: "Location",
        items: [
          { parameterId, price: 2000, quantity: 1 } // correct price is 1000
        ]
      }];
      
      const promise = Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, items)
      );
      
      await expect(promise).rejects.toThrow();
    });

    it("should create order items successfully", async () => {
      const { orderId, locationId, parameterId } = await setupMockData();
      
      const items = [{
        id: locationId,
        name: "Location",
        items: [
          { parameterId, price: 1000, quantity: 3 }
        ]
      }];
      
      const result = await Effect.runPromise(
        orderItemQueries.createOrderItems(mockDb, orderId, items)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.parameterId).toBe(parameterId);
      expect(result[0]?.quantity).toBe(3);
      expect(result[0]?.subTotal).toBe(3000);
    });
  });
});
