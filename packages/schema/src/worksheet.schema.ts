import { worksheets, worksheetItems, worksheetNotes } from "@tepian-k3/db/schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { WORKSHEET_STATUS, WORKSHEET_NOTE_STATUS } from "@tepian-k3/constants";

// Base schemas from drizzle
const baseWorksheetSchema = createInsertSchema(worksheets);
const baseWorksheetItemSchema = createInsertSchema(worksheetItems);
const baseWorksheetNoteSchema = createInsertSchema(worksheetNotes);

// Create worksheet from testing
const createWorksheetFromTestingSchema = z.object({
  testingId: z.string().uuid(),
  startDate: z.string().datetime(),
  mainSupervisorId: z.string().uuid().optional(),
  accompanyingSupervisorId: z.string().uuid().optional(),
});

// Create worksheet from order (kaji ulang phase - before offering)
const createWorksheetFromOrderSchema = z.object({
  orderId: z.string().uuid(),
  startDate: z.string().datetime(),
  mainSupervisorId: z.string().uuid().optional(),
  accompanyingSupervisorId: z.string().uuid().optional(),
});

// Submit worksheet for verification
const submitForVerificationSchema = z.object({
  worksheetId: z.string().uuid(),
});

// Verify worksheet (coordinator action)
const verifyWorksheetSchema = z.object({
  worksheetId: z.string().uuid(),
  mainSupervisorId: z.string().uuid().optional(),
  accompanyingSupervisorId: z.string().uuid().optional(),
});

// Update worksheet status
const updateWorksheetStatusSchema = z.object({
  worksheetId: z.string().uuid(),
  status: z.enum(WORKSHEET_STATUS),
  endDate: z.string().datetime().optional(),
  result: z.string().optional(),
});

// Update worksheet supervisors
const updateWorksheetSupervisorsSchema = z.object({
  worksheetId: z.string().uuid(),
  mainSupervisorId: z.string().uuid().optional().nullable(),
  accompanyingSupervisorId: z.string().uuid().optional().nullable(),
});

// Update worksheet item value (for lab technicians)
const updateWorksheetItemValueSchema = z.object({
  itemId: z.string().uuid(),
  value: z.number(),
  note: z.string().optional(),
  isReady: z.boolean().optional(),
});

// Batch update worksheet items
const batchUpdateWorksheetItemsSchema = z.object({
  worksheetId: z.string().uuid(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      value: z.number().nullable(),
      note: z.string().optional().nullable(),
      isReady: z.boolean().optional(),
    })
  ),
});

// Assign tools to worksheet
const assignToolsToWorksheetSchema = z.object({
  worksheetId: z.string().uuid(),
  toolIds: z.array(z.string().uuid()),
});

// Assign employees to worksheet
const assignEmployeesToWorksheetSchema = z.object({
  worksheetId: z.string().uuid(),
  employeeIds: z.array(z.string().uuid()),
});

// Add worksheet note
const addWorksheetNoteSchema = z.object({
  worksheetId: z.string().uuid(),
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
  worksheetId: z.string().uuid(),
  result: z.string().optional(),
});

const worksheetSchema = {
  baseWorksheetSchema,
  baseWorksheetItemSchema,
  baseWorksheetNoteSchema,
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
};

export default worksheetSchema;
