import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import userCompanyTestingLocationQueries from "../../pengujian/user-company-testing-location.queries";
import { userCompanyTestingLocation } from "@tepian-k3/db/schema";
import { createMockUserAndCompany } from "../helpers/fixtures";

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

describe("userCompanyTestingLocationQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getUserCompanyTestingLocationById", () => {
    it("should retrieve a testing location by ID", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);
      
      const locationId = uuidv7();
      await mockDb.insert(userCompanyTestingLocation).values({
        id: locationId,
        userCompanyId: companyId,
        userId: userId,
        name: "Test Location",
        address: "Test Address",
        regencyId: uuidv7(),
        districtId: uuidv7(),
      });

      const result = await Effect.runPromise(
        userCompanyTestingLocationQueries.getUserCompanyTestingLocationById(locationId)
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(locationId);
      expect(result?.name).toBe("Test Location");
    });
  });
});
