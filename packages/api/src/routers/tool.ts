import toolsSchema from "@tepian-k3/schema/tools.schema";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
} from "..";
import toolsQureies from "@tepian-k3/queries/tools.queries";
import z from "zod";
import { runEffect } from "../utils/run-effect";
import toolCalibrationSchema from "@tepian-k3/schema/tool-calibration.schema";
import toolCalibrationQueries from "@tepian-k3/queries/tool-calibration.queries";
import { Effect } from "effect";
import { imageService } from "@tepian-k3/services/image";
import { storageService } from "@tepian-k3/services/storage";
import { TRPCError } from "@trpc/server";

export const toolRouter = createTRPCRouter({
  getAllUnassignedTools: withPermission("tools.view").query(
    async () => await runEffect(toolsQureies.getAllUnassignedTools()),
  ),

  getToolPaginated: withPermission("tools.view")
    .input(toolsSchema.getAllToolsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        toolsQureies.getOffsetPaginatedTools(input),
      );

      return { data, pageCount };
    }),

  getPaginatedCalibrations: withPermission("tool-calibrations.view")
    .input(
      toolCalibrationSchema.getAllToolCalibrationsSchema.extend({
        toolId: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        toolCalibrationQueries.getPaginatedToolCalibrations(
          input.toolId,
          input,
        ),
      );

      return { data, pageCount };
    }),

  getForWorksheet: withPermission("tools.view")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .query(async ({ input }) => {
      return await runEffect(toolsQureies.getForWorksheet(input.worksheetId));
    }),

  getToolDetails: withPermission("tools.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) => await runEffect(toolsQureies.getToolById(input.id)),
    ),

  getToolCalibrationDetails: withPermission("tool-calibrations.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        toolCalibrationQueries.getToolCalibrationById(input.id),
      );

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Kalibrasi alat dengan ID ${input.id} tidak ditemukan`,
        });
      }

      return result;
    }),

  getToolCalibrationCertificate: withPermission("tool-calibrations.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          toolCalibrationQueries.getToolCalibrationCertificatesById(input.id),
        ),
    ),

  getToolCalibrationDocumentation: withPermission("tool-calibrations.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          toolCalibrationQueries.getToolCalibrationDocumentationsById(input.id),
        ),
    ),

  getToolCalibrationDocumentationById: withPermission("tool-calibrations.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          toolCalibrationQueries.getToolCalibrationDocumentationById(input.id),
        ),
    ),

  createTool: withPermission("tools.create")
    .input(toolsSchema.createToolSchema)
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.createTool(input)),
    ),

  createToolCalibration: withPermission("tool-calibrations.create")
    .input(formDataInput)
    .use(formDataProcedure(toolCalibrationSchema.createToolCalibrationSchema))
    .mutation(
      async ({ ctx }) =>
        await runEffect(
          toolCalibrationQueries.createToolCalibration(ctx.input.data),
        ),
    ),

  createToolCertification: withPermission("tool-certifications.create")
    .input(formDataInput)
    .use(formDataProcedure(toolCalibrationSchema.createToolCertificationSchema))
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const buffer = yield* Effect.tryPromise(() =>
            ctx.input.data.certificationFile
              .arrayBuffer()
              .then((ab) => Buffer.from(ab)),
          );

          const uploadedFile = yield* storageService.upload(buffer, {
            filename: ctx.input.data.certificationFile.name,
            folder: "tool-certifications",
          });

          const result =
            yield* toolCalibrationQueries.createToolCalibrationCertificate({
              toolCalibrationId: ctx.input.data.toolCalibrationId,
              key: uploadedFile.key,
            });

          return result;
        }),
      ),
    ),

  createToolDocumentation: withPermission("tool-documentations.create")
    .input(formDataInput)
    .use(formDataProcedure(toolCalibrationSchema.createToolDocumentationSchema))
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const documetationKey: string[] = [];

          for (const file of ctx.input.data.documentationFiles) {
            const buffer = yield* Effect.tryPromise(() =>
              file.arrayBuffer().then((ab) => Buffer.from(ab)),
            );

            const convertedImage = yield* imageService.convertToWebP(buffer, {
              quality: 80,
              effort: 4,
              filename: file.name,
            });

            const uploadedFile = yield* storageService.upload(
              convertedImage.buffer,
              {
                filename: convertedImage.filename!,
                folder: "tool-documentations",
              },
            );

            documetationKey.push(uploadedFile.key);
          }

          const result =
            yield* toolCalibrationQueries.createToolCalibrationDocumentation({
              toolCalibrationId: ctx.input.data.toolCalibrationId,
              key: documetationKey,
            });

          return result;
        }),
      ),
    ),

  updateTool: withPermission("tools.update")
    .input(toolsSchema.updateToolSchema)
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.updateTool(input)),
    ),

  deleteTool: withPermission("tools.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.deleteTool(input.id)),
    ),

  deleteToolCalibration: withPermission("tool-calibrations.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(toolCalibrationQueries.deleteToolCalibration(input.id)),
    ),

  restoreTool: withPermission("tools.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.restoreTool(input.id)),
    ),

  restoreToolCalibration: withPermission("tool-calibrations.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          toolCalibrationQueries.restoreToolCalibration(input.id),
        ),
    ),
});
