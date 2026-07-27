import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "@tepian-k3/db";
import { chatbotKnowledgeBase } from "@tepian-k3/db/schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { z } from "zod";
import chatbotSchema from "@tepian-k3/schema/platform/chatbot.schema";

const chatbotQueries = {
  /**
   * Mengambil semua knowledge base yang aktif (untuk public API chatbot)
   */
  getAllActive: () =>
    Effect.tryPromise({
      try: () =>
        db.query.chatbotKnowledgeBase.findMany({
          where: and(
            isNull(chatbotKnowledgeBase.deletedAt),
            eq(chatbotKnowledgeBase.isActive, true)
          ),
          orderBy: asc(chatbotKnowledgeBase.createdAt),
        }),
      catch: (error) => {
        logError("chatbot.queries", "getAllActive", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data chatbot knowledge base.",
        });
      },
    }),

  /**
   * Mengambil list paginated untuk tabel admin
   */
  getOffsetPaginated: (
    input: z.infer<typeof chatbotSchema.getAllKnowledgeSchema>
  ) =>
    Effect.tryPromise({
      try: async () => {
        const offset = (input.page - 1) * input.perPage;
        const searchCondition = input.search
          ? or(
              ilike(chatbotKnowledgeBase.topic, `%${input.search}%`),
              ilike(chatbotKnowledgeBase.answer, `%${input.search}%`)
            )
          : undefined;

        const whereCondition = and(
          isNull(chatbotKnowledgeBase.deletedAt),
          searchCondition
        );

        const data = await db.query.chatbotKnowledgeBase.findMany({
          where: whereCondition,
          limit: input.perPage,
          offset,
          orderBy: desc(chatbotKnowledgeBase.createdAt),
        });

        const resultCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(chatbotKnowledgeBase)
          .where(whereCondition);

        const count = resultCount[0]?.count ?? 0;
        const pageCount = Math.ceil(Number(count) / input.perPage);

        return { data, pageCount };
      },
      catch: (error) => {
        logError("chatbot.queries", "getOffsetPaginated", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data chatbot knowledge base paginated.",
        });
      },
    }),

  /**
   * Mengambil 1 item by ID
   */
  getById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const item = await db.query.chatbotKnowledgeBase.findFirst({
          where: and(
            eq(chatbotKnowledgeBase.id, id),
            isNull(chatbotKnowledgeBase.deletedAt)
          ),
        });

        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data chatbot knowledge base tidak ditemukan.",
          });
        }
        return item;
      },
      catch: (error) => {
        logError("chatbot.queries", "getById", { error, id });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data chatbot knowledge base.",
        });
      },
    }),

  /**
   * Membuat item baru
   */
  create: (input: z.infer<typeof chatbotSchema.createKnowledgeSchema>) =>
    Effect.tryPromise({
      try: async () => {
        const [result] = await db
          .insert(chatbotKnowledgeBase)
          .values({
            topic: input.topic,
            keywords: input.keywords,
            answer: input.answer,
            sourceType: input.sourceType,
            pdfFileKey: input.pdfFileKey,
            pdfFileName: input.pdfFileName,
          })
          .returning();
        return result;
      },
      catch: (error) => {
        logError("chatbot.queries", "create", { error, input });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data chatbot knowledge base.",
        });
      },
    }),

  /**
   * Update item
   */
  update: (input: z.infer<typeof chatbotSchema.updateKnowledgeSchema>) =>
    Effect.tryPromise({
      try: async () => {
        const [result] = await db
          .update(chatbotKnowledgeBase)
          .set({
            topic: input.topic,
            keywords: input.keywords,
            answer: input.answer,
            sourceType: input.sourceType,
            pdfFileKey: input.pdfFileKey,
            pdfFileName: input.pdfFileName,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(chatbotKnowledgeBase.id, input.id),
              isNull(chatbotKnowledgeBase.deletedAt)
            )
          )
          .returning();

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data chatbot knowledge base tidak ditemukan atau sudah dihapus.",
          });
        }
        return result;
      },
      catch: (error) => {
        logError("chatbot.queries", "update", { error, input });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate data chatbot knowledge base.",
        });
      },
    }),

  /**
   * Soft delete item
   */
  softDelete: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const [result] = await db
          .update(chatbotKnowledgeBase)
          .set({
            deletedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(chatbotKnowledgeBase.id, id),
              isNull(chatbotKnowledgeBase.deletedAt)
            )
          )
          .returning();

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data chatbot knowledge base tidak ditemukan atau sudah dihapus.",
          });
        }
        return result;
      },
      catch: (error) => {
        logError("chatbot.queries", "softDelete", { error, id });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data chatbot knowledge base.",
        });
      },
    }),
};

export default chatbotQueries;
