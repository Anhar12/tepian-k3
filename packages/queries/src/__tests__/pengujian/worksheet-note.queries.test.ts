import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import worksheetNoteQueries from "../../pengujian/worksheet-note.queries";
import { order, orderItem, parameters, parameterCategories, clusters, userCompanyTestingLocation, worksheets, worksheetNotes } from "@tepian-k3/db/schema";
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

// Using a slightly different mock here because worksheet-note.queries.ts imports logError from effect/Effect
vi.mock("effect/Effect", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    logError: vi.fn(),
  };
});

describe("worksheetNoteQueries", () => {
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

    // Create order item
    const orderItemId = uuidv7();
    await mockDb.insert(orderItem).values({
      id: orderItemId,
      orderId,
      locationId,
      parameterId,
      price: 1000,
      quantity: 1,
      subTotal: 1000,
    });

    // Create worksheet
    const worksheetId = uuidv7();
    await mockDb.insert(worksheets).values({
      id: worksheetId,
      orderId,
      status: "draft",
      createdBy: userId,
    });

    return { userId, worksheetId };
  };

  describe("getWorksheetNoteByWorksheetId", () => {
    it("should return empty array when no notes exist", async () => {
      const { worksheetId } = await setupMockData();
      
      const result = await Effect.runPromise(
        worksheetNoteQueries.getWorksheetNoteByWorksheetId(worksheetId)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it("should return worksheet notes with createdBy relation", async () => {
      const { worksheetId, userId } = await setupMockData();
      
      await mockDb.insert(worksheetNotes).values({
        id: uuidv7(),
        worksheetId,
        createdBy: userId,
        severity: "info",
        note: "This is a note",
        createdById: userId,
        createdAt: new Date(),
      });

      const result = await Effect.runPromise(
        worksheetNoteQueries.getWorksheetNoteByWorksheetId(worksheetId)
      );
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.note).toBe("This is a note");
      expect(result[0]?.createdBy).toBeDefined();
      expect(result[0]?.createdBy?.id).toBe(userId);
    });
    
    it("should fail gracefully on db error", async () => {
      // Mock db implementation to throw
      vi.spyOn(mockDb.query.worksheetNotes, 'findMany').mockRejectedValue(new Error("DB Connection Error"));
      
      const promise = Effect.runPromise(
        worksheetNoteQueries.getWorksheetNoteByWorksheetId(uuidv7())
      );
      
      await expect(promise).rejects.toThrow();
    });
  });
});
