import {
  worksheets,
  worksheetItems,
  worksheetNotes,
  worksheetOperationalCosts,
  worksheetChemicalMaterials,
} from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import {
  WORKSHEET_STATUS,
  WORKSHEET_NOTE_STATUS,
  BAHAN_UNITS,
} from "@tepian-k3/constants";

// Base schemas from drizzle
const baseWorksheetSchema = createInsertSchema(worksheets);
const baseWorksheetItemSchema = createInsertSchema(worksheetItems);
const baseWorksheetNoteSchema = createInsertSchema(worksheetNotes);
const baseWorksheetOperationalCostSchema = createInsertSchema(
  worksheetOperationalCosts,
);
const baseWorksheetChemicalMaterialSchema = createInsertSchema(
  worksheetChemicalMaterials,
);

// Create worksheet from testing
const createWorksheetFromTestingSchema = z.object({
  testingId: z.uuidv7(),
  startDate: z.string().datetime(),
  mainSupervisorId: z.uuidv7().optional(),
  accompanyingSupervisorId: z.uuidv7().optional(),
});

// Create worksheet from order (kaji ulang phase - before offering)
const createWorksheetFromOrderSchema = z.object({
  orderId: z.uuidv7(),
  startDate: z.string().datetime().optional(),
  mainSupervisorId: z.uuidv7().optional(),
  accompanyingSupervisorId: z.uuidv7().optional(),
});

// Submit worksheet for verification
const submitForVerificationSchema = z.object({
  worksheetId: z.uuidv7(),
});

// Verify worksheet (coordinator action)
const verifyWorksheetSchema = z.object({
  worksheetId: z.uuidv7(),
  mainSupervisorId: z.uuidv7().optional(),
  accompanyingSupervisorId: z.uuidv7().optional(),
});

// Update worksheet status
const updateWorksheetStatusSchema = z.object({
  worksheetId: z.uuidv7(),
  status: z.enum(WORKSHEET_STATUS),
  endDate: z.string().datetime().optional(),
  result: z.string().optional(),
});

// Update worksheet supervisors
const updateWorksheetSupervisorsSchema = z.object({
  worksheetId: z.uuidv7(),
  mainSupervisorId: z.uuidv7().optional().nullable(),
  accompanyingSupervisorId: z.uuidv7().optional().nullable(),
});

// Update worksheet item value (for lab technicians)
const updateWorksheetItemValueSchema = z.object({
  itemId: z.uuidv7(),
  value: z.number(),
  note: z.string().optional(),
  isReady: z.boolean().optional(),
});

// Batch update worksheet items
const batchUpdateWorksheetItemsSchema = z.object({
  worksheetId: z.uuidv7(),
  items: z.array(
    z.object({
      itemId: z.uuidv7(),
      value: z.number().nullable(),
      note: z.string().optional().nullable(),
      isReady: z.boolean().optional(),
    }),
  ),
});

// Assign tools to worksheet
const assignToolsToWorksheetSchema = z.object({
  worksheetId: z.uuidv7(),
  toolIds: z.array(z.uuidv7()),
});

// Assign employees to worksheet (with optional schedule dates)
const assignEmployeesToWorksheetSchema = z.object({
  worksheetId: z.uuidv7(),
  employeeIds: z.array(z.uuidv7()),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

// Add worksheet note
const addWorksheetNoteSchema = z.object({
  worksheetId: z.uuidv7(),
  note: z.string().min(1).max(1000),
  severity: z.enum(WORKSHEET_NOTE_STATUS).default("info"),
});

// Get worksheets with pagination
const getWorksheetsSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  status: z.enum(WORKSHEET_STATUS).optional(),
  search: z.string().optional(),
});

// Complete worksheet (marks all items as ready and updates status)
const completeWorksheetSchema = z.object({
  worksheetId: z.uuidv7(),
  result: z.string().optional(),
});

// Get worksheet transaction detail
const getWorksheetTransactionDetailSchema = z.object({
  worksheetId: z.uuidv7(),
});

// Operational cost item schema
const operationalCostItemSchema = z.object({
  id: z.uuidv7().optional(),
  item: z.string().min(1).max(255),
  unitCount: z.number().int().min(0).default(1),
  days: z.number().int().min(0).default(1),
  unitCost: z.number().int().min(0).nullable(),
  note: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

// Save operational costs (batch upsert)
const saveWorksheetOperationalCostsSchema = z.object({
  worksheetId: z.uuidv7(),
  costs: z.array(operationalCostItemSchema),
});

// Chemical material item schema for batch operations
const worksheetChemicalMaterialItemSchema = z.object({
  chemicalMaterialId: z.uuidv7(),
  required: z.number().min(0).default(0),
  requiredUnit: z.enum(BAHAN_UNITS).optional().nullable(),
});

// Save worksheet chemical materials (batch upsert)
const saveWorksheetChemicalMaterialsSchema = z.object({
  worksheetId: z.uuidv7(),
  materials: z.array(worksheetChemicalMaterialItemSchema),
});

// Update single worksheet chemical material required quantity
const updateWorksheetChemicalMaterialRequiredSchema = z.object({
  worksheetId: z.uuidv7(),
  chemicalMaterialId: z.uuidv7(),
  required: z.number().min(0),
  requiredUnit: z.enum(BAHAN_UNITS).optional().nullable(),
});

// Get worksheet chemical materials schema
const getWorksheetChemicalMaterialsSchema = z.object({
  worksheetId: z.uuidv7(),
});

const worksheetSchema = {
  baseWorksheetSchema,
  baseWorksheetItemSchema,
  baseWorksheetNoteSchema,
  baseWorksheetOperationalCostSchema,
  baseWorksheetChemicalMaterialSchema,
  createWorksheetFromTestingSchema,
  createWorksheetFromOrderSchema,
  submitForVerificationSchema,
  verifyWorksheetSchema,
  updateWorksheetStatusSchema,
  updateWorksheetSupervisorsSchema,
  updateWorksheetItemValueSchema,
  batchUpdateWorksheetItemsSchema,
  assignToolsToWorksheetSchema,
  assignEmployeesToWorksheetSchema,
  addWorksheetNoteSchema,
  getWorksheetsSchema,
  completeWorksheetSchema,
  getWorksheetTransactionDetailSchema,
  operationalCostItemSchema,
  saveWorksheetOperationalCostsSchema,
  worksheetChemicalMaterialItemSchema,
  saveWorksheetChemicalMaterialsSchema,
  updateWorksheetChemicalMaterialRequiredSchema,
  getWorksheetChemicalMaterialsSchema,
};

export default worksheetSchema;
