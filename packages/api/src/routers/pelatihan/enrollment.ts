import {
  protectedProcedure,
  createTRPCRouter,
  withPermission,
  formDataInput,
  formDataProcedure,
} from "../..";
import { runEffect } from "../../utils/run-effect";
import { z } from "zod";
import pelatihanSchema from "@tepian-k3/schema/pelatihan/pelatihan.schema";
import { processAndUploadFile } from "../../utils/image-upload";
import { storageService } from "@tepian-k3/services/storage";
import { Effect } from "effect";

export const enrollmentRouter = createTRPCRouter({
  getAllEnrollments: withPermission("pelatihan-enrollments.read")
    .input(
      pelatihanSchema.getAllEnrollmentsSchema.extend({
        pelatihanId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      const queries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(queries.getAllEnrollments(input));
    }),

  getUserEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const enrollmentQueries =
      await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
        (m) => m.default,
      );
    return await runEffect(enrollmentQueries.getUserEnrollments(ctx.user.id));
  }),

  getUserEnrollmentsByType: protectedProcedure
    .input(
      z.object({
        type: z.enum(["elearning", "bimtek", "webinar"]),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      const { type, ...rest } = input;
      return await runEffect(
        enrollmentQueries.getUserEnrollmentsByType(ctx.user.id, type, rest),
      );
    }),

  getUserCertificates: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.getUserCertificates(ctx.user.id, input),
      );
    }),

  getUserEnrollmentById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.getUserEnrollmentById(input.id, ctx.user.id),
      );
    }),

  markMaterialCompleted: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string().uuid(),
        materialId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.markMaterialCompleted(
          input.enrollmentId,
          input.materialId,
          ctx.user.id,
        ),
      );
    }),

  enrollFreePelatihan: protectedProcedure
    .input(z.object({ pelatihanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.enrollFreePelatihan(ctx.user.id, input.pelatihanId),
      );
    }),

  registerBimtek: protectedProcedure
    .input(pelatihanSchema.registerBimtekSchema)
    .mutation(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.registerBimtek(ctx.user.id, input),
      );
    }),

  updateBimtekDocuments: protectedProcedure
    .input(pelatihanSchema.updateBimtekDocumentsSchema)
    .mutation(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.updateBimtekDocuments(ctx.user.id, input),
      );
    }),

  uploadBimtekDocument: protectedProcedure
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          file: z.custom<File>((val) => val instanceof File, {
            message: "File berkas wajib diunggah",
          }),
        }),
      ),
    )
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const uploadedFile = yield* processAndUploadFile(
            ctx.input.data.file,
            {
              folder: "pelatihan/bimtek-registrations",
            },
          );
          return {
            key: uploadedFile.key,
            url: storageService.getPublicUrl(uploadedFile.key),
            name: ctx.input.data.file.name,
          };
        }),
      ),
    ),

  getBimtekSchedules: protectedProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const scheduleQueries =
        await import("@tepian-k3/queries/pelatihan/schedule.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        scheduleQueries.getBimtekSchedules(input.enrollmentId, ctx.user.id),
      );
    }),

  checkInBimtek: protectedProcedure
    .input(pelatihanSchema.checkInBimtekSchema)
    .mutation(async ({ ctx, input }) => {
      const scheduleQueries =
        await import("@tepian-k3/queries/pelatihan/schedule.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        scheduleQueries.checkInBimtek(
          input.enrollmentId,
          input.scheduleId,
          input.status,
          ctx.user.id,
          input.attendanceToken,
        ),
      );
    }),

  verifyEnrollment: withPermission("pelatihan-enrollments.verify")
    .input(pelatihanSchema.verifyEnrollmentSchema)
    .mutation(async ({ ctx, input }) => {
      const enrollmentQueries =
        await import("@tepian-k3/queries/pelatihan/enrollment.queries").then(
          (m) => m.default,
        );
      return await runEffect(
        enrollmentQueries.verifyEnrollment(ctx.user.id, ctx.user.email, input),
      );
    }),
});
