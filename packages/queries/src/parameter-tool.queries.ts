import { db } from "@tepian-k3/db/client";
import { eq } from "@tepian-k3/db";
import { parameterTools } from "@tepian-k3/db/schema";
import { z } from "zod";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import parameterToolSchema from "@tepian-k3/schema/parameter-tool.schema";
import { TRPCError } from "@trpc/server";
import parameterQueries from "./parameter.queries";
import toolsQueries from "./tools.queries";

const parameterToolQueries = {
  getAllToolsByParameterId(parameterId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameterTools.findMany({
          where: eq(parameterTools.parameterId, parameterId),
          with: {
            tool: {
              columns: {
                id: true,
                toolName: true,
                toolCode: true,
              },
            },
            parameter: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "parameterToolQueries.getAllToolsByParameterId",
          "Failed to fetch tools by parameter ID",
          { parameterId, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil tools untuk parameter tersebut.",
        });
      },
    });
  },

  getParameterToolById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameterTools.findFirst({
          where: eq(parameterTools.id, id),
          with: {
            parameter: {
              columns: {
                id: true,
                name: true,
              },
            },
            tool: {
              columns: {
                id: true,
                toolName: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "parameterToolQueries.getParameterToolById",
          "Failed to fetch parameter tool by ID",
          { id, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil parameter tool berdasarkan ID.",
        });
      },
    });
  },

  assignToolToParameter(
    data: z.infer<typeof parameterToolSchema.createParameterToolSchema>
  ) {
    return Effect.gen(function* () {
      const isParameterExist = yield* parameterQueries.getParameterById(
        data.parameterId
      );

      if (!isParameterExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Parameter tidak ditemukan.",
        });
      }

      const isToolExist = yield* toolsQueries.getToolById(data.toolId);

      if (!isToolExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Tool tidak ditemukan.",
          })
        );
      }

      const isAlreadyAssigned = yield* parameterToolQueries
        .getAllToolsByParameterId(data.parameterId)
        .pipe(
          Effect.map((assignments) =>
            assignments.find((assignment) => assignment.toolId === data.toolId)
          )
        );

      if (isAlreadyAssigned) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Tool sudah ditugaskan ke parameter tersebut.",
          })
        );
      }

      const [result] = yield* Effect.tryPromise({
        try: () => db.insert(parameterTools).values(data).returning(),
        catch: (error) => {
          logError(
            "parameterToolQueries.assignToolToParameter",
            "Failed to assign tool to parameter",
            { data, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menugaskan tool ke parameter.",
          });
        },
      });

      if (!result) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menugaskan tool ke parameter.",
          })
        );
      }

      return result;
    });
  },

  updateParameterTool(
    data: z.infer<typeof parameterToolSchema.updateParameterToolSchema>
  ) {
    return Effect.gen(function* () {
      const existingRecord = yield* parameterToolQueries.getParameterToolById(
        data.id
      );

      if (!existingRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data parameter tool tidak ditemukan.",
        });
      }

      const isParameterExist = yield* parameterQueries.getParameterById(
        data.parameterId
      );

      if (!isParameterExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Parameter tidak ditemukan.",
        });
      }

      const isToolExist = yield* toolsQueries.getToolById(data.toolId);

      if (!isToolExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Tool tidak ditemukan.",
          })
        );
      }

      const [updatedRecord] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameterTools)
            .set({
              parameterId: data.parameterId ?? existingRecord.parameterId,
              toolId: data.toolId ?? existingRecord.toolId,
            })
            .where(eq(parameterTools.id, data.id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterToolQueries.updateParameterTool",
            "Failed to update parameter tool",
            { data, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui parameter tool.",
          });
        },
      });

      if (!updatedRecord) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui parameter tool.",
          })
        );
      }

      return updatedRecord;
    });
  },

  removeToolFromParameter(id: string) {
    return Effect.gen(function* () {
      const existingRecord = yield* parameterToolQueries.getParameterToolById(
        id
      );

      if (!existingRecord) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Data parameter tool tidak ditemukan.",
          })
        );
      }

      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .delete(parameterTools)
            .where(eq(parameterTools.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterToolQueries.removeToolFromParameter",
            "Failed to remove tool from parameter",
            { id, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus tool dari parameter.",
          });
        },
      });

      if (!result) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus tool dari parameter.",
          })
        );
      }

      return result;
    });
  },
};

export default parameterToolQueries;
