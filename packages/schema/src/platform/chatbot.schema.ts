import { z } from "zod";

const createKnowledgeSchema = z.object({
  topic: z.string().min(3, "Topik minimal 3 karakter"),
  keywords: z.array(z.string().min(1)).min(1, "Minimal 1 kata kunci"),
  answer: z.string().min(10, "Jawaban minimal 10 karakter"),
  sourceType: z.enum(["manual", "pdf"]).default("manual"),
  pdfFileKey: z.string().optional().nullable(),
  pdfFileName: z.string().optional().nullable(),
});

const updateKnowledgeSchema = createKnowledgeSchema.extend({
  id: z.string().uuid(),
});

const getAllKnowledgeSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  search: z.string().optional(),
});

const chatbotSchema = {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  getAllKnowledgeSchema,
};

export default chatbotSchema;
