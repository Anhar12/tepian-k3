import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import parameterQueries from "../../pengujian/parameter.queries";
import { createMockParameter } from "../helpers/fixtures";

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

describe("parameterQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getOffsetPaginatedParameters", () => {
    it("should return list of parameters", async () => {
      const { parameterId } = await createMockParameter(mockDb);

      const res = await Effect.runPromise(
        parameterQueries.getOffsetPaginatedParameters({
          page: 1,
          perPage: 10,
          createdAt: [],
          sort: [],
          filters: [],
          name: "",
          joinOperator: "and",
          showDeleted: false,
        })
      );

      expect(res).toBeDefined();
      expect(res.data.length).toBeGreaterThanOrEqual(1);
      const p = res.data.find((x: any) => x.id === parameterId);
      expect(p).toBeDefined();
      expect(p?.name).toBe(`Test Parameter ${parameterId}`);
    });
  });

  describe("getParameterById", () => {
    it("should return a parameter by id", async () => {
      const { parameterId } = await createMockParameter(mockDb);

      const param = await Effect.runPromise(
        parameterQueries.getParameterById(parameterId)
      );

      expect(param).toBeDefined();
      expect(param?.id).toBe(parameterId);
    });

    it("should return undefined for non-existent parameter", async () => {
      const nonExistentId = uuidv7();
      const param = await Effect.runPromise(
        parameterQueries.getParameterById(nonExistentId)
      );
      expect(param).toBeFalsy();
    });
  });
});
