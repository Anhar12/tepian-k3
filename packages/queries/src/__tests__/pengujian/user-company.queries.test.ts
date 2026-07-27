import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { createMockUserAndCompany } from "../helpers/fixtures";
import userCompanyQueries from "../../pengujian/user-company.queries";

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

vi.mock("@tepian-k3/services/storage", () => {
  return {
    storageService: {
      getPublicUrl: (path: string) => `http://mock-storage.com/${path}`,
      getKeyFromUrl: (url: string) => url,
    },
  };
});

vi.mock("@tepian-k3/services/queue", () => {
  return {
    QueueName: { CLEANUP: "cleanup" },
    queueService: {
      addJob: vi.fn().mockResolvedValue(true),
    },
  };
});

describe("userCompanyQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllUserCompaniesByUserId", () => {
    it("should return company by user id", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);

      const uc = await Effect.runPromise(
        userCompanyQueries.getAllUserCompaniesByUserId(userId)
      );

      expect(uc).toBeDefined();
      expect(uc?.length).toBeGreaterThanOrEqual(1);
      expect(uc?.[0]?.id).toBe(companyId);
      expect(uc?.[0]?.userId).toBe(userId);
    });

    it("should return empty array for user with no company", async () => {
      const nonExistentUserId = uuidv7();
      const uc = await Effect.runPromise(
        userCompanyQueries.getAllUserCompaniesByUserId(nonExistentUserId)
      );
      expect(uc?.length).toBe(0);
    });
  });

  describe("getUserCompanyById", () => {
    it("should return company by id", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);

      const uc = await Effect.runPromise(
        userCompanyQueries.getUserCompanyById(companyId)
      );

      expect(uc).toBeDefined();
      expect(uc?.id).toBe(companyId);
      expect(uc?.userId).toBe(userId);
    });

    it("should return null for non-existent company id", async () => {
      const nonExistentCompanyId = uuidv7();
      const uc = await Effect.runPromise(
        userCompanyQueries.getUserCompanyById(nonExistentCompanyId)
      );
      expect(uc).toBeNull();
    });
  });

  describe("getUserCompanyDetailsByUserIdAndId", () => {
    it("should return company details by user id and id", async () => {
      const { userId, companyId } = await createMockUserAndCompany(mockDb);

      const company = await Effect.runPromise(
        userCompanyQueries.getUserCompanyDetailsByUserIdAndId(userId, companyId)
      );

      expect(company).toBeDefined();
      expect(company?.id).toBe(companyId);
    });
  });
});
