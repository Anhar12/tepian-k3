import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  publicProcedure,
  withPermission,
} from "../..";
import { runEffect } from "../../utils/run-effect";
import chatbotSchema from "@tepian-k3/schema/platform/chatbot.schema";
import chatbotQueries from "@tepian-k3/queries/platform/chatbot.queries";
import auditQueries from "@tepian-k3/queries/platform/audit.queries";
import settingQueries from "@tepian-k3/queries/platform/setting.queries";
import { storageService } from "@tepian-k3/services/storage";

export const chatbotRouter = createTRPCRouter({
  // ── PUBLIC (dipanggil chatbot widget tanpa login) ──────────────
  getAll: publicProcedure.query(async () => {
    return await runEffect(chatbotQueries.getAllActive());
  }),

  ask: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "model"]),
              text: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await runEffect(
        Effect.gen(function* () {
          const kbItems = yield* chatbotQueries.getAllActive();
          const waSetting = yield* settingQueries.getSettingByKey("chatbot_wa_number");
          const waNumber = waSetting?.value || "";

          // Fallback response generator if Gemini fails or is not configured
          const getFallbackResponse = () => {
            const query = input.message.toLowerCase();
            if (kbItems && kbItems.length > 0) {
              for (const item of kbItems) {
                if (item.keywords.some((k: string) => query.includes(k.toLowerCase()))) {
                  return item.answer;
                }
              }
            }
            const baseMsg = "Maaf, saya tidak menemukan jawaban yang sesuai di sistem saya. Untuk informasi lebih lanjut, silakan hubungi admin kami.";
            if (waNumber) {
              const waLink = `https://wa.me/${waNumber}`;
              return `${baseMsg}\n\nKlik link berikut untuk menghubungi admin: ${waLink}`;
            }
            return baseMsg;
          };

          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            return { text: getFallbackResponse() };
          }

          const result = yield* Effect.tryPromise({
            try: async () => {
              const { GoogleGenerativeAI } = await import("@google/generative-ai");
              const genAI = new GoogleGenerativeAI(apiKey);
              const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

              const kbText = kbItems
                .map((item) => `Topik: ${item.topic}\nKata Kunci: ${item.keywords.join(", ")}\nJawaban: ${item.answer}`)
                .join("\n\n");

              const systemInstruction = `Anda adalah Asty, asisten virtual untuk Tepian K3 (Keselamatan dan Kesehatan Kerja).
Tugas Anda adalah membantu pengguna menjawab pertanyaan seputar layanan Tepian K3 berdasarkan basis pengetahuan berikut:

${kbText}

Aturan:
1. Jawablah dengan sopan, ramah, dan profesional dalam Bahasa Indonesia.
2. Gunakan HANYA informasi dari basis pengetahuan di atas untuk menjawab. Jika informasi tidak ada di basis pengetahuan, katakan dengan sopan bahwa Anda tidak tahu, dan sarankan untuk menghubungi WhatsApp admin di ${waNumber} jika tersedia.
3. Jangan pernah memberikan informasi yang bertentangan dengan basis pengetahuan di atas.`;

              const chatHistory = (input.history || []).map((h) => ({
                role: h.role,
                parts: [{ text: h.text }],
              }));

              const chat = model.startChat({
                history: chatHistory,
                systemInstruction,
              });

              const response = await chat.sendMessage(input.message);
              return { text: response.response.text() };
            },
            catch: () => ({ text: getFallbackResponse() }),
          });

          return result;
        })
      );
    }),


  // ── ADMIN: Baca knowledge base (tabel) ────────────────────────
  getPaginated: withPermission("banners.view")
    .input(chatbotSchema.getAllKnowledgeSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        chatbotQueries.getOffsetPaginated(input)
      );
      return { data, pageCount };
    }),

  // ── ADMIN: Tambah knowledge base ────────────────
  create: withPermission("banners.create")
    .input(chatbotSchema.createKnowledgeSchema)
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          const result = yield* chatbotQueries.create(input);
          
          if (!result) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal membuat data chatbot knowledge base.",
            });
          }

          yield* auditQueries.createAuditLog({
            entityType: "chatbot_knowledge_base",
            entityId: result.id,
            action: "create",
            userId: ctx.user.id,
            userEmail: ctx.user.email,
            oldValues: null,
            newValues: result,
            description: `Membuat knowledge base chatbot: "${result.topic}"`,
          });
          
          return result;
        })
      );
    }),

  // ── ADMIN: Upload PDF → simpan file ke storage ────────────────
  uploadPdf: withPermission("banners.create")
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          pdf: z.file().max(10 * 1024 * 1024).mime(["application/pdf"]),
        })
      )
    )
    .mutation(async ({ ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          const file = ctx.input.data.pdf;
          const arrayBuffer = yield* Effect.tryPromise({
            try: () => file.arrayBuffer(),
            catch: () =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membaca file PDF.",
              }),
          });
          const buffer = Buffer.from(arrayBuffer);

          const filename = `chatbot-doc-${Date.now()}.pdf`;
          const uploadedFile = yield* storageService.upload(buffer, {
            filename,
            folder: "chatbot-documents",
            contentType: "application/pdf",
          });

          // Return key & nama file
          return { key: uploadedFile.key, name: file.name };
        })
      );
    }),

  // ── ADMIN: Edit knowledge base ────────────────────────────────
  update: withPermission("banners.update")
    .input(chatbotSchema.updateKnowledgeSchema)
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          const oldData = yield* chatbotQueries.getById(input.id);
          const result = yield* chatbotQueries.update(input);

          if (!result) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal mengupdate data chatbot knowledge base.",
            });
          }

          yield* auditQueries.createAuditLog({
            entityType: "chatbot_knowledge_base",
            entityId: result.id,
            action: "update",
            userId: ctx.user.id,
            userEmail: ctx.user.email,
            oldValues: oldData,
            newValues: result,
            description: `Mengupdate knowledge base chatbot: "${result.topic}"`,
          });

          return result;
        })
      );
    }),

  // ── ADMIN: Hapus (soft delete) ────────────────────────────────
  delete: withPermission("banners.update")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          const result = yield* chatbotQueries.softDelete(input.id);

          if (!result) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal menghapus data chatbot knowledge base.",
            });
          }

          yield* auditQueries.createAuditLog({
            entityType: "chatbot_knowledge_base",
            entityId: result.id,
            action: "delete",
            userId: ctx.user.id,
            userEmail: ctx.user.email,
            oldValues: result,
            newValues: null,
            description: `Menghapus knowledge base chatbot: "${result.topic}"`,
          });

          return result;
        })
      );
    }),
});
