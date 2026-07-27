import { describe, it, expect, beforeEach, vi } from "vitest";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import { Effect } from "effect";
import { v7 as uuidv7 } from "uuid";
import toolCalibrationQueries from "../../pengujian/tool-calibration.queries";
import { toolCalibrations, tools, toolCodes, toolCalibrationCertificates, toolCalibrationDocumentations } from "@tepian-k3/db/schema";
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

// Mock logger
vi.mock("@tepian-k3/services/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

// Mock storage
vi.mock("@tepian-k3/services/storage", () => ({
  storageService: {
    delete: vi.fn(() => Effect.succeed(true)),
  },
}));

describe("toolCalibrationQueries", () => {
  let mockDb: any;
  
  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  const createMockTool = async (db: any) => {
    const toolCodeId = uuidv7();
    await db.insert(toolCodes).values({
      id: toolCodeId,
      code: "TC-CALIB",
      description: "Test Calibration Tool",
    });

    const toolId = uuidv7();
    await db.insert(tools).values({
      id: toolId,
      toolCodeId,
      toolUniqueCode: "TUC-CALIB",
      toolName: "Calibration Tool",
      availability: "ready",
      condition: "baik",
      brand: "Brand X",
      stock: 1,
      price: 100,
    });
    
    return toolId;
  };

  describe("getAllToolCalibrations", () => {
    it("should get all tool calibrations", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "Initial calibration",
      });

      const result = await Effect.runPromise(toolCalibrationQueries.getAllToolCalibrations());
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getToolCalibrationById", () => {
    it("should get tool calibration by id", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "Initial calibration",
      });

      const result = await Effect.runPromise(toolCalibrationQueries.getToolCalibrationById(calibrationId));
      expect(result).toBeDefined();
      expect(result?.id).toBe(calibrationId);
      expect(result?.toolId).toBe(toolId);
    });
    
    it("should return undefined if calibration does not exist", async () => {
      const result = await Effect.runPromise(toolCalibrationQueries.getToolCalibrationById(uuidv7()));
      expect(result).toBeFalsy();
    });
  });

  describe("createToolCalibration", () => {
    it("should create new tool calibration", async () => {
      const toolId = await createMockTool(mockDb);
      
      const result = await Effect.runPromise(
        toolCalibrationQueries.createToolCalibration({
          toolId,
          calibrationDate: new Date().toISOString(),
          note: "New calibration note",
        })
      );
      
      expect(result).toBeDefined();
      expect(result.toolId).toBe(toolId);
      expect(result.note).toBe("New calibration note");
    });
    
    it("should create tool calibration with certificate and documentation", async () => {
      const toolId = await createMockTool(mockDb);
      
      const result = await Effect.runPromise(
        toolCalibrationQueries.createToolCalibration({
          toolId,
          calibrationDate: new Date().toISOString(),
          note: "With attachments",
          certificateKey: "cert-key-1",
          documentationKeys: ["doc-key-1", "doc-key-2"],
        })
      );
      
      expect(result).toBeDefined();
      
      const certs = await Effect.runPromise(toolCalibrationQueries.getToolCalibrationCertificatesById(result.id));
      expect(certs).toBeDefined();
      expect(certs?.certificateFileUrl).toBe("cert-key-1");
      
      const docs = await Effect.runPromise(toolCalibrationQueries.getToolCalibrationDocumentationsById(result.id));
      expect(docs.length).toBe(2);
    });

    it("should fail if tool does not exist", async () => {
      const promise = Effect.runPromise(
        toolCalibrationQueries.createToolCalibration({
          toolId: uuidv7(),
          calibrationDate: new Date().toISOString(),
          note: "Invalid tool",
        })
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("updateToolCalibration", () => {
    it("should update tool calibration note", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "Initial calibration",
      });

      const updated = await Effect.runPromise(
        toolCalibrationQueries.updateToolCalibration({
          id: calibrationId,
          note: "Updated calibration",
        })
      );

      expect(updated).toBeDefined();
      expect(updated.note).toBe("Updated calibration");
    });
    
    it("should update certificate", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "Initial calibration",
      });
      
      await mockDb.insert(toolCalibrationCertificates).values({
        toolCalibrationId: calibrationId,
        certificateFileUrl: "old-cert",
      });

      const updated = await Effect.runPromise(
        toolCalibrationQueries.updateToolCalibration({
          id: calibrationId,
          certificateKey: "new-cert",
        })
      );

      expect(updated).toBeDefined();
      
      const certs = await Effect.runPromise(toolCalibrationQueries.getToolCalibrationCertificatesById(calibrationId));
      expect(certs).toBeDefined();
      expect(certs?.certificateFileUrl).toBe("new-cert");
    });

    it("should fail to update non-existent tool calibration", async () => {
      const promise = Effect.runPromise(
        toolCalibrationQueries.updateToolCalibration({
          id: uuidv7(),
          note: "Should fail",
        })
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("deleteToolCalibration", () => {
    it("should soft delete a tool calibration", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "To be deleted",
      });

      const deleted = await Effect.runPromise(
        toolCalibrationQueries.deleteToolCalibration(calibrationId)
      );

      expect(deleted).toBeDefined();
      expect(deleted.deletedAt).not.toBeNull();
      
      // Verification using deleted query
      const verify = await Effect.runPromise(
        toolCalibrationQueries.getDeletedToolCalibrationById(calibrationId)
      );
      expect(verify).toBeDefined();
      expect(verify?.id).toBe(calibrationId);
    });

    it("should fail to delete non-existent calibration", async () => {
      const promise = Effect.runPromise(
        toolCalibrationQueries.deleteToolCalibration(uuidv7())
      );
      await expect(promise).rejects.toThrow();
      
    });
  });

  describe("restoreToolCalibration", () => {
    it("should restore a deleted tool calibration", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "To be restored",
        deletedAt: new Date().toISOString(),
      });

      const restored = await Effect.runPromise(
        toolCalibrationQueries.restoreToolCalibration(calibrationId)
      );

      expect(restored).toBeDefined();
      expect(restored.deletedAt).toBeNull();
    });

    it("should fail to restore if calibration is not deleted or does not exist", async () => {
      const toolId = await createMockTool(mockDb);
      const calibrationId = uuidv7();
      
      await mockDb.insert(toolCalibrations).values({
        id: calibrationId,
        toolId,
        calibrationDate: new Date().toISOString(),
        note: "Not deleted",
      });

      const promise = Effect.runPromise(
        toolCalibrationQueries.restoreToolCalibration(calibrationId)
      );
      await expect(promise).rejects.toThrow();
      
    });
  });
});
