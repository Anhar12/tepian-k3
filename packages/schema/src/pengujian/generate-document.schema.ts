import z from "zod";

export const qrSignaturePositionSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string().min(1),
  purpose: z.string().min(1),
  page: z.number().int().min(0).default(0),
  x: z.number().min(0).default(450),
  y: z.number().min(0).default(700),
  width: z.number().min(60).max(200).default(100),
  height: z.number().min(60).max(200).default(100),
});

const generateOfferingLetterDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  referenceNumber: z.string().min(1).max(250).optional(),
  referenceDate: z.string().optional(),
  adminEmail: z.email().min(1).max(100),
  adminContact: z.string().min(1).max(100),
  signatures: z.array(qrSignaturePositionSchema).optional().default([]),
});

const generateSpkDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  agreementDate: z.string().min(1),
  signatures: z.array(qrSignaturePositionSchema).optional().default([]),
});

const generateTagihanDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  referenceNumber: z.string().min(1).max(250),
  referenceDate: z.string().min(1),
  billingCode: z.string().min(1).max(100),
  billingExpiryDate: z.string().min(1),
  signatures: z.array(qrSignaturePositionSchema).optional().default([]),
});

const generateAssignmentLetter = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(255),
  assignmentLetterNumber: z.string().min(1).max(255),
  signatures: z.array(qrSignaturePositionSchema).optional().default([]),
});

const generateDocumentSchema = {
  qrSignaturePositionSchema,
  generateOfferingLetterDocumentSchema,
  generateSpkDocumentSchema,
  generateTagihanDocumentSchema,
  generateAssignmentLetter,
};

export default generateDocumentSchema;
