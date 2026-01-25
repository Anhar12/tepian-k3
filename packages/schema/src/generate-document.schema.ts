import z from "zod";

const generateOfferingLetterDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  referenceNumber: z.string().min(1).max(250).optional(),
  referenceDate: z.string().optional(),
  adminEmail: z.email().min(1).max(100),
  adminContact: z.string().min(1).max(100),
});

const generateDocumentSchema = {
  generateOfferingLetterDocumentSchema,
};

export default generateDocumentSchema;
