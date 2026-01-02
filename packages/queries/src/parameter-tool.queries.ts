import { db } from "@tepian-k3/db/client";
import { eq } from "@tepian-k3/db";
import { parameterTools } from "@tepian-k3/db/schema";
import { z } from "zod";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
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
        }),
      catch: (error) => {
        logger.error("Error fetching tools by parameter ID", {
          error,
          parameterId,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tools for the given parameter ID.",
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
        logger.error("Error fetching parameter tool by ID", { error, id });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch parameter tool for the given ID.",
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
          message: "Parameter does not exist.",
        });
      }

      const isToolExist = yield* toolsQueries.getToolById(data.toolId);

      if (!isToolExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Tool does not exist.",
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
            message: "Tool is already assigned to the parameter.",
          })
        );
      }

      const [result] = yield* Effect.tryPromise({
        try: () => db.insert(parameterTools).values(data).returning(),
        catch: (error) => {
          logger.error("Error assigning tool to parameter", { error, data });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to assign tool to parameter.",
          });
        },
      });

      if (!result) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to assign tool to parameter.",
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
          message: "Parameter tool record not found.",
        });
      }

      const isParameterExist = yield* parameterQueries.getParameterById(
        data.parameterId
      );

      if (!isParameterExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Parameter does not exist.",
        });
      }

      const isToolExist = yield* toolsQueries.getToolById(data.toolId);

      if (!isToolExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Tool does not exist.",
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
          logger.error("Error updating parameter tool", { error, data });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update parameter tool.",
          });
        },
      });

      if (!updatedRecord) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update parameter tool.",
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
            message: "Parameter tool record not found.",
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
          logger.error("Error removing tool from parameter", { error, id });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to remove tool from parameter.",
          });
        },
      });

      if (!result) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to remove tool from parameter.",
          })
        );
      }

      return result;
    });
  },
};

export default parameterToolQueries;
