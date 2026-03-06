import z from "zod";

const generateOfferingLetterDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  referenceNumber: z.string().min(1).max(250).optional(),
  referenceDate: z.string().optional(),
  adminEmail: z.email().min(1).max(100),
  adminContact: z.string().min(1).max(100),
});

const generateSpkDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  agreementDate: z.string().min(1),
  companyRepName: z.string().min(1).max(250),
  companyRepPosition: z.string().min(1).max(250),
  companyRepAddress: z.string().min(1).max(500),
});

const generateTagihanDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  referenceNumber: z.string().min(1).max(250),
  referenceDate: z.string().min(1),
  billingCode: z.string().min(1).max(100),
  billingExpiryDate: z.string().min(1),
});

const generateAssignmentLetter = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(255),
  assignmentLetterNumber: z.string().min(1).max(255),
});

const generateDocumentSchema = {
  generateOfferingLetterDocumentSchema,
  generateSpkDocumentSchema,
  generateTagihanDocumentSchema,
  generateAssignmentLetter,
};

export default generateDocumentSchema;
