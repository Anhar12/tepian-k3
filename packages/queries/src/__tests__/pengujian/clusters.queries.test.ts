import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import clustersQueries from "../../pengujian/clusters.queries";
import { clusters } from "@tepian-k3/db/schema";

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

describe("clustersQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getAllClusters", () => {
    it("should return list of clusters", async () => {
      const clusterId = uuidv7();
      await mockDb.insert(clusters).values({
        id: clusterId,
        name: `Test Cluster ${clusterId}`,
        acronym: "TC",
      });

      const clusterList = await Effect.runPromise(
        clustersQueries.getAllClusters()
      );

      expect(clusterList).toBeDefined();
      expect(clusterList.length).toBeGreaterThanOrEqual(1);
      const c = clusterList.find((c: any) => c.id === clusterId);
      expect(c).toBeDefined();
      expect(c?.name).toBe(`Test Cluster ${clusterId}`);
    });
  });

  describe("getClusterById", () => {
    it("should return a cluster by id", async () => {
      const clusterId = uuidv7();
      await mockDb.insert(clusters).values({
        id: clusterId,
        name: `Test Cluster ${clusterId}`,
        acronym: "TC",
      });

      const c = await Effect.runPromise(
        clustersQueries.getClusterById(clusterId)
      );

      expect(c).toBeDefined();
      expect(c?.id).toBe(clusterId);
      expect(c?.name).toBe(`Test Cluster ${clusterId}`);
    });

    it("should return undefined for non-existent cluster", async () => {
      const nonExistentId = uuidv7();
      const c = await Effect.runPromise(
        clustersQueries.getClusterById(nonExistentId)
      );
      expect(c).toBeFalsy();
    });
  });

  describe("getDeletedClusterById", () => {
    it("should return a deleted cluster by id", async () => {
      const clusterId = uuidv7();
      await mockDb.insert(clusters).values({
        id: clusterId,
        name: `Test Cluster ${clusterId}`,
        acronym: "TC",
        deletedAt: new Date().toISOString(),
      });

      const c = await Effect.runPromise(
        clustersQueries.getDeletedClusterById(clusterId)
      );

      expect(c).toBeDefined();
      expect(c?.id).toBe(clusterId);
      expect(c?.name).toBe(`Test Cluster ${clusterId}`);
    });
  });

  describe("getClusterByName", () => {
    it("should return a cluster by name", async () => {
      const clusterId = uuidv7();
      const clusterName = `Test Cluster ${clusterId}`;
      await mockDb.insert(clusters).values({
        id: clusterId,
        name: clusterName,
        acronym: "TC",
      });

      const c = await Effect.runPromise(
        clustersQueries.getClusterByName(clusterName)
      );

      expect(c).toBeDefined();
      expect(c?.id).toBe(clusterId);
      expect(c?.name).toBe(clusterName);
    });

    it("should return undefined for non-existent cluster by name", async () => {
      const c = await Effect.runPromise(
        clustersQueries.getClusterByName("NonExistentName")
      );
      expect(c).toBeFalsy();
    });
  });
});
