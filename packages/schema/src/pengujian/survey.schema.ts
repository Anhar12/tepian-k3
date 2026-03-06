import { surveyQuestions } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import { createPaginationSchema } from "../platform/pagination.schema";

// ==================== SURVEY QUESTION SCHEMAS (ADMIN) ====================

export const SORTABLE_SURVEY_QUESTION_FIELDS = [
  "questionText",
  "order",
  "isActive",
  "createdAt",
  "updatedAt",
] as const satisfies readonly (keyof typeof surveyQuestions.$inferSelect)[];

const getAllSurveyQuestionsSchema = createPaginationSchema(
  SORTABLE_SURVEY_QUESTION_FIELDS,
).extend({
  search: z.string().default(""),
  showInactive: z.boolean().default(false),
});

const createSurveyQuestionSchema = createInsertSchema(surveyQuestions, {
  questionText: z
    .string()
    .min(5, "Pertanyaan minimal 5 karakter")
    .max(500, "Pertanyaan maksimal 500 karakter"),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Form-specific schema with required fields for React Hook Form
const createSurveyQuestionFormSchema = z.object({
  questionText: z
    .string()
    .min(5, "Pertanyaan minimal 5 karakter")
    .max(500, "Pertanyaan maksimal 500 karakter"),
  order: z.number().int().min(0),
  isActive: z.boolean(),
});

const updateSurveyQuestionSchema = createUpdateSchema(surveyQuestions, {
  id: z.uuidv7(),
  questionText: z.optional(
    z
      .string()
      .min(5, "Pertanyaan minimal 5 karakter")
      .max(500, "Pertanyaan maksimal 500 karakter"),
  ),
  order: z.optional(z.number().int().min(0)),
  isActive: z.optional(z.boolean()),
});

const reorderSurveyQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.uuidv7(),
      order: z.number().int().min(0),
    }),
  ),
});

// ==================== SURVEY SUBMISSION SCHEMAS (USER) ====================

const surveyResponseItemSchema = z.object({
  questionId: z.uuidv7(),
  rating: z
    .number()
    .int()
    .min(1, "Rating minimal 1")
    .max(5, "Rating maksimal 5"),
});

const submitSurveySchema = z.object({
  orderId: z.uuidv7(),
  responses: z
    .array(surveyResponseItemSchema)
    .min(1, "Harus menjawab minimal satu pertanyaan"),
  feedback: z
    .string()
    .max(2000, "Kritik & saran maksimal 2000 karakter")
    .optional(),
});

const getSurveyForOrderSchema = z.object({
  orderId: z.uuidv7(),
});

const checkSurveyExistsSchema = z.object({
  orderId: z.uuidv7(),
});

// ==================== EXPORT ====================

const surveySchema = {
  // Question management (admin)
  getAllSurveyQuestionsSchema,
  createSurveyQuestionSchema,
  createSurveyQuestionFormSchema,
  updateSurveyQuestionSchema,
  reorderSurveyQuestionsSchema,

  // Survey submission (user)
  submitSurveySchema,
  getSurveyForOrderSchema,
  checkSurveyExistsSchema,
};

export default surveySchema;
