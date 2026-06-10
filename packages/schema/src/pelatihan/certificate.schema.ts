import { z } from "zod";

const fieldPositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  fontSize: z.number().min(6).max(128),
  color: z.string().optional().default("#000000"),
  align: z.enum(["left", "center", "right"]).optional().default("center"),
  enabled: z.boolean().default(false),
});

const qrCodePositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(10).max(500),
  height: z.number().min(10).max(500),
  enabled: z.boolean().default(false),
});

export const certificateFieldMappingsSchema = z.object({
  participantName: fieldPositionSchema.optional(),
  certificateNumber: fieldPositionSchema.optional(),
  pelatihanTitle: fieldPositionSchema.optional(),
  completionDate: fieldPositionSchema.optional(),
  issuedAt: fieldPositionSchema.optional(),
  finalScore: fieldPositionSchema.optional(),
  instructorName: fieldPositionSchema.optional(),
  qrCode: qrCodePositionSchema.optional(),
});

export const createCertificateTemplateSchema = z.object({
  pelatihanId: z.string().uuid(),
  name: z.string().min(1).max(250),
  description: z.string().optional(),
  templateFileUrl: z.string().url(),
  templateFileName: z.string().min(1),
  templateFileType: z.string().min(1),
  fieldMappings: certificateFieldMappingsSchema.optional(),
});

export const updateCertificateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(250).optional(),
  description: z.string().optional(),
  fieldMappings: certificateFieldMappingsSchema.optional(),
});

export const verifyCertificateSchema = z.object({
  token: z.string().min(1),
});

export const revokeCertificateSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().min(1, "Alasan pencabutan wajib diisi"),
});

export type CertificateFieldMappings = z.infer<typeof certificateFieldMappingsSchema>;
