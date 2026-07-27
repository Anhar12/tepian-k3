import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import surveyQueries from "../../pengujian/survey.queries";
import { surveyQuestions } from "@tepian-k3/db/schema";

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

describe("surveyQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("getSurveyQuestionById", () => {
    it("should return a survey question by id", async () => {
      const id = uuidv7();
      await mockDb.insert(surveyQuestions).values({
        id,
        questionText: `Test Survey Question ${id}`,
        isActive: true,
        order: 1,
      });

      const sq = await Effect.runPromise(
        surveyQueries.getSurveyQuestionById(id)
      );

      expect(sq).toBeDefined();
      expect(sq?.id).toBe(id);
      expect(sq?.questionText).toBe(`Test Survey Question ${id}`);
    });

    it("should return undefined for non-existent id", async () => {
      const id = uuidv7();
      const sq = await Effect.runPromise(
        surveyQueries.getSurveyQuestionById(id)
      );
      expect(sq).toBeFalsy();
    });
  });

  describe("getActiveSurveyQuestions", () => {
    it("should return active survey questions", async () => {
      const id = uuidv7();
      await mockDb.insert(surveyQuestions).values({
        id,
        questionText: `Test Active Survey Question ${id}`,
        isActive: true,
        order: 2,
      });

      const list = await Effect.runPromise(
        surveyQueries.getActiveSurveyQuestions()
      );

      expect(list).toBeDefined();
      expect(list.length).toBeGreaterThanOrEqual(1);
      const sq = list.find((q: any) => q.id === id);
      expect(sq).toBeDefined();
    });
  });

  describe("createSurveyQuestion", () => {
    it("should create a new survey question", async () => {
      const sq = await Effect.runPromise(
        surveyQueries.createSurveyQuestion({
          questionText: "New Survey Question",
          isActive: true,
          order: 3,
        } as any)
      );

      expect(sq).toBeDefined();
      expect(sq?.questionText).toBe("New Survey Question");
      expect(sq?.id).toBeDefined();
    });
  });

  describe("updateSurveyQuestion", () => {
    it("should update a survey question", async () => {
      const id = uuidv7();
      await mockDb.insert(surveyQuestions).values({
        id,
        questionText: `Old Survey Question ${id}`,
        isActive: true,
        order: 4,
      });

      const updated = await Effect.runPromise(
        surveyQueries.updateSurveyQuestion({
          id,
          questionText: "Updated Survey Question",
        } as any)
      );

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(id);
      expect(updated?.questionText).toBe("Updated Survey Question");
    });
  });
});
