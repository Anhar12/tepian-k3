import surveySchema from "@tepian-k3/schema/survey.schema";
import {
  createTRPCRouter,
  protectedProcedure,
  withPermission,
  withRateLimit,
} from "..";
import surveyQueries from "@tepian-k3/queries/survey.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const surveyRouter = createTRPCRouter({
  // ==================== QUESTION MANAGEMENT (ADMIN) ====================

  getAllQuestions: withPermission("survey-questions.view").query(
    async () => await runEffect(surveyQueries.getAllSurveyQuestions()),
  ),

  getPaginatedQuestions: withPermission("survey-questions.view")
    .input(surveySchema.getAllSurveyQuestionsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        surveyQueries.getPaginatedSurveyQuestions(input),
      );
      return { data, pageCount };
    }),

  getQuestionById: withPermission("survey-questions.read")
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input }) => {
      const question = await runEffect(
        surveyQueries.getSurveyQuestionById(input.id),
      );

      if (!question) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pertanyaan survey tidak ditemukan",
        });
      }

      return question;
    }),

  createQuestion: withPermission("survey-questions.create")
    .input(surveySchema.createSurveyQuestionSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(surveyQueries.createSurveyQuestion(input)),
    ),

  updateQuestion: withPermission("survey-questions.update")
    .input(surveySchema.updateSurveyQuestionSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(surveyQueries.updateSurveyQuestion(input)),
    ),

  reorderQuestions: withPermission("survey-questions.update")
    .input(surveySchema.reorderSurveyQuestionsSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(surveyQueries.reorderSurveyQuestions(input)),
    ),

  deleteQuestion: withPermission("survey-questions.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(
      async ({ input }) =>
        await runEffect(surveyQueries.deleteSurveyQuestion(input.id)),
    ),

  restoreQuestion: withPermission("survey-questions.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(
      async ({ input }) =>
        await runEffect(surveyQueries.restoreSurveyQuestion(input.id)),
    ),

  // ==================== SURVEY SUBMISSION (USER) ====================

  // Get active questions for survey form (for authenticated users)
  getActiveQuestions: withRateLimit(rateLimiters.moderate()).query(
    async () => await runEffect(surveyQueries.getActiveSurveyQuestions()),
  ),

  // Check if survey already submitted for an order
  checkSurveyStatus: protectedProcedure
    .input(surveySchema.checkSurveyExistsSchema)
    .query(async ({ input }) => {
      const existing = await runEffect(
        surveyQueries.checkSurveyExists(input.orderId),
      );
      return { hasSubmitted: !!existing };
    }),

  // Get survey data for an order (for viewing submitted survey)
  getSurveyForOrder: protectedProcedure
    .input(surveySchema.getSurveyForOrderSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          surveyQueries.getSurveyWithFeedbackForOrder(input.orderId),
        ),
    ),

  // Submit survey
  submitSurvey: protectedProcedure
    .input(surveySchema.submitSurveySchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          surveyQueries.submitSurvey(
            input.orderId,
            ctx.user.id,
            input.responses,
            input.feedback,
          ),
        ),
    ),

  // ==================== STATISTICS (ADMIN) ====================

  getStatistics: withPermission("survey-responses.view").query(
    async () => await runEffect(surveyQueries.getSurveyStatistics()),
  ),
});
