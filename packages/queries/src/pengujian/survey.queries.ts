import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  avg,
} from "@tepian-k3/db";
import {
  order,
  surveyFeedback,
  surveyQuestions,
  surveyResponses,
} from "@tepian-k3/db/schema";
import { z } from "zod";
import surveySchema from "@tepian-k3/schema/pengujian/survey.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const surveyQueries = {
  // ==================== QUESTION MANAGEMENT (ADMIN) ====================

  getSurveyQuestionById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyQuestions.findFirst({
          where: and(
            eq(surveyQuestions.id, id),
            isNull(surveyQuestions.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "surveyQueries.getSurveyQuestionById",
          "Error fetching survey question by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data pertanyaan survey",
        });
      },
    }).pipe(
      Effect.flatMap((question) =>
        question ? Effect.succeed(question) : Effect.succeed(null),
      ),
    );
  },

  getDeletedSurveyQuestionById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyQuestions.findFirst({
          where: and(
            eq(surveyQuestions.id, id),
            isNotNull(surveyQuestions.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "surveyQueries.getDeletedSurveyQuestionById",
          "Error fetching deleted survey question by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data pertanyaan survey yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((question) =>
        question ? Effect.succeed(question) : Effect.succeed(null),
      ),
    );
  },

  getActiveSurveyQuestions() {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyQuestions.findMany({
          where: and(
            eq(surveyQuestions.isActive, true),
            isNull(surveyQuestions.deletedAt),
          ),
          orderBy: [asc(surveyQuestions.order)],
        }),
      catch: (error) => {
        logError(
          "surveyQueries.getActiveSurveyQuestions",
          "Error fetching active survey questions",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil daftar pertanyaan survey",
        });
      },
    });
  },

  getAllSurveyQuestions() {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyQuestions.findMany({
          where: isNull(surveyQuestions.deletedAt),
          orderBy: [asc(surveyQuestions.order)],
        }),
      catch: (error) => {
        logError(
          "surveyQueries.getAllSurveyQuestions",
          "Error fetching all survey questions",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data pertanyaan survey",
        });
      },
    });
  },

  getPaginatedSurveyQuestions(
    input: z.infer<typeof surveySchema.getAllSurveyQuestionsSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: surveyQuestions,
            filters: input.filters as ExtendedColumnFilter<
              typeof surveyQuestions
            >[],
            joinOperator: "and",
          })
        : and(
            input.search
              ? ilike(surveyQuestions.questionText, `%${input.search}%`)
              : undefined,
            input.showInactive ? undefined : eq(surveyQuestions.isActive, true),
            input.showDeleted
              ? isNotNull(surveyQuestions.deletedAt)
              : isNull(surveyQuestions.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(surveyQuestions[item.id])
                : asc(surveyQuestions[item.id]),
            )
          : [asc(surveyQuestions.order)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(surveyQuestions)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({ count: count() })
              .from(surveyQuestions)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "surveyQueries.getPaginatedSurveyQuestions",
            "Error fetching paginated survey questions",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil daftar pertanyaan survey",
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return { data, pageCount };
    });
  },

  createSurveyQuestion(
    data: z.infer<typeof surveySchema.createSurveyQuestionSchema>,
  ) {
    return Effect.gen(function* () {
      // Get max order to auto-set order if not provided
      const maxOrderResult = yield* Effect.tryPromise({
        try: () =>
          db
            .select({ count: count() })
            .from(surveyQuestions)
            .where(isNull(surveyQuestions.deletedAt))
            .then((res) => res[0]?.count ?? 0),
        catch: () => 0,
      });

      const [newQuestion] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(surveyQuestions)
            .values({
              ...data,
              order: data.order ?? maxOrderResult,
            })
            .returning(),
        catch: (error) => {
          logError(
            "surveyQueries.createSurveyQuestion",
            "Error creating survey question",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat pertanyaan survey",
          });
        },
      });

      if (!newQuestion) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat pertanyaan survey",
        });
      }

      return newQuestion;
    });
  },

  updateSurveyQuestion(
    data: z.infer<typeof surveySchema.updateSurveyQuestionSchema>,
  ) {
    return Effect.gen(function* () {
      const existing = yield* surveyQueries.getSurveyQuestionById(data.id);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pertanyaan survey tidak ditemukan",
        });
      }

      const [updated] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(surveyQuestions)
            .set({
              questionText: data.questionText ?? existing.questionText,
              order: data.order ?? existing.order,
              isActive: data.isActive ?? existing.isActive,
            })
            .where(eq(surveyQuestions.id, data.id))
            .returning(),
        catch: (error) => {
          logError(
            "surveyQueries.updateSurveyQuestion",
            "Error updating survey question",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pertanyaan survey",
            cause: error,
          });
        },
      });

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui pertanyaan survey",
        });
      }

      return updated;
    });
  },

  reorderSurveyQuestions(
    data: z.infer<typeof surveySchema.reorderSurveyQuestionsSchema>,
  ) {
    return Effect.tryPromise({
      try: async () => {
        await db.transaction(async (tx) => {
          for (const item of data.questions) {
            await tx
              .update(surveyQuestions)
              .set({ order: item.order })
              .where(eq(surveyQuestions.id, item.id));
          }
        });
        return { success: true };
      },
      catch: (error) => {
        logError(
          "surveyQueries.reorderSurveyQuestions",
          "Error reordering survey questions",
          { error, data },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengatur ulang urutan pertanyaan survey",
        });
      },
    });
  },

  deleteSurveyQuestion(id: string) {
    return Effect.gen(function* () {
      const existing = yield* surveyQueries.getSurveyQuestionById(id);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pertanyaan survey tidak ditemukan",
        });
      }

      const [deleted] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(surveyQuestions)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(surveyQuestions.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "surveyQueries.deleteSurveyQuestion",
            "Error deleting survey question",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus pertanyaan survey",
            cause: error,
          });
        },
      });

      if (!deleted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus pertanyaan survey",
        });
      }

      return deleted;
    });
  },

  restoreSurveyQuestion(id: string) {
    return Effect.gen(function* () {
      const deleted = yield* surveyQueries.getDeletedSurveyQuestionById(id);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pertanyaan survey yang dihapus tidak ditemukan",
        });
      }

      const [restored] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(surveyQuestions)
            .set({ deletedAt: null })
            .where(eq(surveyQuestions.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "surveyQueries.restoreSurveyQuestion",
            "Error restoring survey question",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan pertanyaan survey",
            cause: error,
          });
        },
      });

      if (!restored) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan pertanyaan survey",
        });
      }

      return restored;
    });
  },

  // ==================== SURVEY SUBMISSION (USER) ====================

  checkSurveyExists(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyFeedback.findFirst({
          where: eq(surveyFeedback.orderId, orderId),
        }),
      catch: (error) => {
        logError(
          "surveyQueries.checkSurveyExists",
          "Error checking survey existence",
          { orderId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memeriksa status survey",
        });
      },
    });
  },

  getSurveyResponsesForOrder(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyResponses.findMany({
          where: eq(surveyResponses.orderId, orderId),
          with: {
            question: true,
          },
        }),
      catch: (error) => {
        logError(
          "surveyQueries.getSurveyResponsesForOrder",
          "Error fetching survey responses for order",
          { orderId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data respons survey",
        });
      },
    });
  },

  getSurveyFeedbackForOrder(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.surveyFeedback.findFirst({
          where: eq(surveyFeedback.orderId, orderId),
          with: {
            submittedBy: true,
          },
        }),
      catch: (error) => {
        logError(
          "surveyQueries.getSurveyFeedbackForOrder",
          "Error fetching survey feedback for order",
          { orderId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data feedback survey",
        });
      },
    });
  },

  getSurveyWithFeedbackForOrder(orderId: string) {
    return Effect.gen(function* () {
      const [responses, feedback] = yield* Effect.all([
        surveyQueries.getSurveyResponsesForOrder(orderId),
        surveyQueries.getSurveyFeedbackForOrder(orderId),
      ]);

      return {
        responses,
        feedback,
        hasSubmitted: !!feedback,
      };
    });
  },

  submitSurvey(
    orderId: string,
    userId: string,
    responses: { questionId: string; rating: number }[],
    feedback?: string,
  ) {
    return Effect.gen(function* () {
      // Check if survey already submitted
      const existingSurvey = yield* surveyQueries.checkSurveyExists(orderId);
      if (existingSurvey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Survey untuk order ini sudah diisi",
        });
      }

      // Verify order exists
      const orderData = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: eq(order.id, orderId),
          }),
        catch: (error) => {
          logError("surveyQueries.submitSurvey", "Error fetching order", {
            orderId,
            userId,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data order",
          });
        },
      });

      if (!orderData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order tidak ditemukan",
        });
      }

      // Get active questions to copy question text and validate
      const activeQuestions = yield* surveyQueries.getActiveSurveyQuestions();
      const questionMap = new Map(activeQuestions.map((q) => [q.id, q]));

      // Validate all required questions are answered
      const questionIds = new Set(responses.map((r) => r.questionId));
      const missingQuestions = activeQuestions.filter(
        (q) => !questionIds.has(q.id),
      );

      if (missingQuestions.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Semua pertanyaan wajib dijawab",
        });
      }

      // Submit in transaction
      yield* Effect.tryPromise({
        try: async () => {
          await db.transaction(async (tx) => {
            // Insert all responses with copied questionText
            const responseValues = responses.map((r) => {
              const question = questionMap.get(r.questionId);
              if (!question) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `Pertanyaan dengan ID ${r.questionId} tidak ditemukan`,
                });
              }
              return {
                orderId,
                questionId: r.questionId,
                questionText: question.questionText, // Copy at submission time
                rating: r.rating,
              };
            });

            await tx.insert(surveyResponses).values(responseValues);

            // Insert feedback record
            await tx.insert(surveyFeedback).values({
              orderId,
              feedback: feedback || null,
              submittedByUserId: userId,
            });
          });
        },
        catch: (error) => {
          logError("surveyQueries.submitSurvey", "Error submitting survey", {
            orderId,
            userId,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menyimpan survey",
          });
        },
      });

      return { success: true };
    });
  },

  // ==================== STATISTICS (ADMIN) ====================

  getSurveyStatistics() {
    return Effect.tryPromise({
      try: async () => {
        const result = await db.transaction(async (tx) => {
          // Get total surveys submitted
          const totalSurveys = await tx
            .select({ count: count() })
            .from(surveyFeedback)
            .then((res) => res[0]?.count ?? 0);

          // Get average rating per question
          const avgRatings = await tx
            .select({
              questionId: surveyResponses.questionId,
              questionText: surveyResponses.questionText,
              avgRating: avg(surveyResponses.rating),
              responseCount: count(),
            })
            .from(surveyResponses)
            .groupBy(surveyResponses.questionId, surveyResponses.questionText);

          // Get overall average rating
          const overallAvg = await tx
            .select({
              avgRating: avg(surveyResponses.rating),
            })
            .from(surveyResponses)
            .then((res) => res[0]?.avgRating ?? 0);

          return {
            totalSurveys,
            averageRatings: avgRatings,
            overallAverageRating: Number(overallAvg),
          };
        });

        return result;
      },
      catch: (error) => {
        logError(
          "surveyQueries.getSurveyStatistics",
          "Error fetching survey statistics",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil statistik survey",
        });
      },
    });
  },
};

export default surveyQueries;
