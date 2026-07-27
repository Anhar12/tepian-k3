import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { createMockUserAndCompany } from "../helpers/fixtures";
import { Effect } from "effect";
import testingQueries from "../../pengujian/testing.queries";
import { order, testing } from "@tepian-k3/db/schema";
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

describe("testingQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getTestingById", () => {
    it("should retrieve a testing record with its relations", async () => {
      // 1. Arrange: insert mock data
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      const testingId = uuidv7();

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "100",
      });

      await mockDb.insert(testing).values({
        id: testingId,
        orderId: orderId,
        testingNumber: `TEST-${testingId.substring(0, 8)}`,
        status: "start_testing",
        worksheetId: uuidv7(),
        userId: userId,
        companyId: companyId,
        testingType: uuidv7(),
      });

      // 2. Act
      const result = await Effect.runPromise(testingQueries.getTestingById(testingId));

      // 3. Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(testingId);
      expect(result?.testingNumber).toBe(`TEST-${testingId.substring(0, 8)}`);
      expect(result?.order?.id).toBe(orderId);
    });
  });

  describe("getAllTestings", () => {
    it("should retrieve a paginated list of testings", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      const testingId = uuidv7();
      const testingNumber = `TEST-${testingId.substring(0, 8)}`;

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "200",
      });

      await mockDb.insert(testing).values({
        id: testingId,
        orderId: orderId,
        testingNumber,
        status: "start_testing",
        worksheetId: uuidv7(),
        userId: userId,
        companyId: companyId,
        testingType: uuidv7(),
      });

      const result = await Effect.runPromise(
        testingQueries.getAllTestings(1, 10, testingNumber)
      );

      expect(result).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]?.testingNumber).toBe(testingNumber);
      expect(result.pagination.totalItems).toBeGreaterThan(0);
    });
  });

  describe("updateTestingStatus", () => {
    it("should update testing status successfully", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      const orderId = uuidv7();
      const testingId = uuidv7();

      await mockDb.insert(order).values({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8)}`,
        userId,
        companyId,
        totalAmount: "300",
      });

      await mockDb.insert(testing).values({
        id: testingId,
        orderId: orderId,
        testingNumber: `TEST-${testingId.substring(0, 8)}`,
        status: "start_testing",
        worksheetId: uuidv7(),
        userId: userId,
        companyId: companyId,
        testingType: uuidv7(),
      });

      const result = await Effect.runPromise(
        testingQueries.updateTestingStatus(testingId, "completed", "Test note")
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("completed");
      expect(result.note).toBe("Test note");
    });
  });

  describe("getTestingStatusCount", () => {
    it("should retrieve count of testing statuses", async () => {
      const result = await Effect.runPromise(testingQueries.getTestingStatusCount());

      expect(result).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.start_testing).toBeGreaterThanOrEqual(0);
    });
  });
});
