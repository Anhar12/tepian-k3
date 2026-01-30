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
  companyBankName: z.string().min(1).max(100),
  companyBankAccount: z.string().min(1).max(100),
  companyBankAccountName: z.string().min(1).max(250),
  operationalBankName: z.string().min(1).max(100),
  operationalBankAccount: z.string().min(1).max(100),
  operationalBankAccountName: z.string().min(1).max(250),
});

const generateTagihanDocumentSchema = z.object({
  worksheetId: z.uuidv7(),
  letterNumber: z.string().min(1).max(250),
  referenceNumber: z.string().min(1).max(250),
  referenceDate: z.string().min(1),
  billingCode: z.string().min(1).max(100),
  billingAmount: z.number().positive(),
  operationalAmount: z.number().positive(),
  operationalBankAccount: z.string().min(1).max(100),
  operationalBankAccountName: z.string().min(1).max(250),
  billingExpiryDate: z.string().min(1),
  adminEmail: z.email().min(1).max(100),
  adminContact: z.string().min(1).max(100),
});

const generateDocumentSchema = {
  generateOfferingLetterDocumentSchema,
  generateSpkDocumentSchema,
  generateTagihanDocumentSchema,
};

export default generateDocumentSchema;
