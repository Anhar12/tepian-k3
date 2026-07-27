import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import kbliQueries from "../../pengujian/kbli.queries";
import { kblis } from "@tepian-k3/db/schema";

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

describe("kbliQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllKblis", () => {
    it("should return list of kblis", async () => {
      const kbliId = uuidv7();
      await mockDb.insert(kblis).values({
        id: kbliId,
        code: `K-${kbliId.substring(0, 8)}`,
        name: `Test KBLI ${kbliId}`,
      });

      const kbliList = await Effect.runPromise(
        kbliQueries.getAllKblis()
      );

      expect(kbliList).toBeDefined();
      expect(kbliList.length).toBeGreaterThanOrEqual(1);
      const k = kbliList.find((k: any) => k.id === kbliId);
      expect(k).toBeDefined();
      expect(k?.name).toBe(`Test KBLI ${kbliId}`);
    });
  });

  describe("getKbliById", () => {
    it("should return a kbli by id", async () => {
      const kbliId = uuidv7();
      await mockDb.insert(kblis).values({
        id: kbliId,
        code: `K-${kbliId.substring(0, 8)}`,
        name: `Test KBLI ${kbliId}`,
      });

      const k = await Effect.runPromise(
        kbliQueries.getKbliById(kbliId)
      );

      expect(k).toBeDefined();
      expect(k?.id).toBe(kbliId);
      expect(k?.name).toBe(`Test KBLI ${kbliId}`);
    });

    it("should return undefined for non-existent kbli", async () => {
      const nonExistentId = uuidv7();
      const k = await Effect.runPromise(
        kbliQueries.getKbliById(nonExistentId)
      );
      expect(k).toBeFalsy();
    });
  });

  describe("getDeletedKbliById", () => {
    it("should return a deleted kbli by id", async () => {
      const kbliId = uuidv7();
      await mockDb.insert(kblis).values({
        id: kbliId,
        code: `K-${kbliId.substring(0, 8)}`,
        name: `Test KBLI ${kbliId}`,
        deletedAt: new Date().toISOString(),
      });

      const k = await Effect.runPromise(
        kbliQueries.getDeletedKbliById(kbliId)
      );

      expect(k).toBeDefined();
      expect(k?.id).toBe(kbliId);
      expect(k?.name).toBe(`Test KBLI ${kbliId}`);
    });
  });

  describe("getKbliByName", () => {
    it("should return a kbli by name", async () => {
      const kbliId = uuidv7();
      const kbliName = `Test KBLI ${kbliId}`;
      await mockDb.insert(kblis).values({
        id: kbliId,
        code: `K-${kbliId.substring(0, 8)}`,
        name: kbliName,
      });

      const k = await Effect.runPromise(
        kbliQueries.getKbliByName(kbliName)
      );

      expect(k).toBeDefined();
      expect(k?.id).toBe(kbliId);
      expect(k?.name).toBe(kbliName);
    });

    it("should return undefined for non-existent kbli by name", async () => {
      const k = await Effect.runPromise(
        kbliQueries.getKbliByName("NonExistentName")
      );
      expect(k).toBeFalsy();
    });
  });
});
