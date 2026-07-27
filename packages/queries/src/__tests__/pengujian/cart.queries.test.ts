import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { createMockUserAndCompany, createMockCluster, createMockParameter } from "../helpers/fixtures";
import { Effect } from "effect";
import cartQueries from "../../pengujian/cart.queries";
import { userCompanyTestingLocation } from "@tepian-k3/db/schema";
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

describe("cartQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("insertCartItem and getUserCartList", () => {
    it("should insert a cart item and retrieve it", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      
      const locationId = uuidv7();
      await mockDb.insert(userCompanyTestingLocation).values({
        id: locationId,
        userCompanyId: companyId,
        userId: userId,
        name: "Test Location",
        regencyId: uuidv7(),
        districtId: uuidv7(),
        address: "Test Address",
        latitude: "0",
        longitude: "0",
      });

      const { clusterId, categoryId } = await createMockCluster(mockDb);
      const { parameterId } = await createMockParameter(mockDb, categoryId);

      // Test inserting item to cart
      const inserted = await Effect.runPromise(
        cartQueries.insertCartItem(userId, {
          companyId,
          locationId,
          parameterId,
          quantity: 2,
          price: 1000,
        })
      );

      expect(inserted).toBeDefined();
      expect(inserted.quantity).toBe(2);

      // Test getting cart list
      const cartList = await Effect.runPromise(
        cartQueries.getUserCartList(userId)
      );

      expect(Array.isArray(cartList)).toBe(true);
      expect(cartList.length).toBeGreaterThanOrEqual(1);
      
      const companyEntry = cartList.find((c: any) => c.id === companyId);
      expect(companyEntry).toBeDefined();
      expect(companyEntry?.locations[0]?.id).toBe(locationId);
      expect(companyEntry?.locations[0]?.clusters[0]?.id).toBe(clusterId);
    });

    it("should throw error if cart item is invalid or not found", async () => {
       const { userId, companyId } = await createMockUserAndCompany(mockDb);
       
       const fakeLocationId = uuidv7();
       const fakeParameterId = uuidv7();

       // Test inserting item to cart with invalid parameters should throw
       await expect(
         Effect.runPromise(
           cartQueries.insertCartItem(userId, {
             companyId,
             locationId: fakeLocationId,
             parameterId: fakeParameterId,
             quantity: 2,
             price: 1000,
           })
         )
       ).rejects.toThrow();
    });
  });
});
