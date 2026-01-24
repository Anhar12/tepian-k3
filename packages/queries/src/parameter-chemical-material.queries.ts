import { db } from "@tepian-k3/db/client";
import { eq } from "@tepian-k3/db";
import { parameterChemicalMaterials } from "@tepian-k3/db/schema";
import { z } from "zod";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import parameterChemicalMaterialSchema from "@tepian-k3/schema/parameter-chemical-material.schema";
import { TRPCError } from "@trpc/server";
import parameterQueries from "./parameter.queries";
import chemicalMaterialQueries from "./chemical-material.queries";

const parameterChemicalMaterialsQueries = {
  /**
   * Get all chemical materials by parameter ID
   * @param parameterId - The ID of the parameter
   * Used in parameter detail page to show associated chemical materials
   */
  getAllChemicalMaterialsByParameterId: (parameterId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.parameterChemicalMaterials.findMany({
          where: eq(parameterChemicalMaterials.parameterId, parameterId),
          with: {
            parameter: {
              columns: {
                id: true,
                name: true,
              },
            },
            chemicalMaterial: true,
          },
        }),
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getChemicalMaterialsByParameterId",
          "Error fetching chemical materials by parameter ID",
          { error, parameterId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia untuk parameter",
        });
      },
    }),

  /**
   * Get parameter chemical material by ID
   * @param id - The ID of the parameter chemical material
   * Used in various places to fetch specific parameter chemical material details
   */
  getParameterChemicalMaterialById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.parameterChemicalMaterials.findFirst({
          where: eq(parameterChemicalMaterials.id, id),
          with: {
            parameter: {
              columns: {
                id: true,
                name: true,
              },
            },
            chemicalMaterial: true,
          },
        }),
      catch: (error) => {
        logError(
          "parameterChemicalMaterialQueries.getParameterChemicalMaterialById",
          "Error fetching parameter chemical material by ID",
          { error, id },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia untuk parameter",
        });
      },
    }),

  /**
   * Assign chemical material to parameter
   * @param input - The input data for assigning chemical material
   * Used in create parameter chemical material dialog
   */
  assignChemicalMaterialToParameter: (
    input: z.infer<
      typeof parameterChemicalMaterialSchema.createParameterChemicalMaterialSchema
    >,
  ) =>
    Effect.gen(function* () {
      const isParameterExist = yield* parameterQueries.getParameterById(
        input.parameterId,
      );

      if (!isParameterExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Parameter tidak ditemukan.",
          }),
        );
      }

      yield* chemicalMaterialQueries.getChemicalMaterialById(
        input.chemicalMaterialId,
      );

      const isAlreadyAssigned = yield* parameterChemicalMaterialsQueries
        .getAllChemicalMaterialsByParameterId(input.parameterId)
        .pipe(
          Effect.map((assignments) =>
            assignments.some(
              (assignment) =>
                assignment.chemicalMaterialId === input.chemicalMaterialId,
            ),
          ),
        );

      if (isAlreadyAssigned) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Bahan kimia sudah ditambahkan ke parameter ini.",
          }),
        );
      }

      const [result] = yield* Effect.tryPromise({
        try: () =>
          db.insert(parameterChemicalMaterials).values(input).returning(),
        catch: (error) => {
          logError(
            "parameterChemicalMaterialQueries.assignChemicalMaterialToParameter",
            "Failed to assign chemical material to parameter",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambahkan bahan kimia ke parameter.",
          });
        },
      });

      if (!result) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambahkan bahan kimia ke parameter.",
          }),
        );
      }

      return result;
    }),

  /**
   * Update parameter chemical material
   * @param data - The data for updating parameter chemical material
   * Used in edit parameter chemical material dialog
   */
  updateParameterChemicalMaterial: (
    data: z.infer<
      typeof parameterChemicalMaterialSchema.updateParameterChemicalMaterialSchema
    >,
  ) =>
    Effect.gen(function* () {
      const isExist =
        yield* parameterChemicalMaterialsQueries.getParameterChemicalMaterialById(
          data.id,
        );

      if (!isExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Data bahan kimia untuk parameter tidak ditemukan.",
          }),
        );
      }

      const isParameterExist = yield* parameterQueries.getParameterById(
        data.parameterId,
      );
      if (!isParameterExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Parameter tidak ditemukan.",
          }),
        );
      }

      yield* chemicalMaterialQueries.getChemicalMaterialById(
        data.chemicalMaterialId,
      );

      const [updatedRecord] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameterChemicalMaterials)
            .set({
              parameterId: data.parameterId,
              chemicalMaterialId: data.chemicalMaterialId,
            })
            .where(eq(parameterChemicalMaterials.id, data.id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterChemicalMaterialQueries.updateParameterChemicalMaterial",
            "Failed to update parameter chemical material",
            { data, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui bahan kimia untuk parameter.",
          });
        },
      });

      return updatedRecord;
    }),

  /**
   * Remove parameter chemical material by ID
   * @param id - The ID of the parameter chemical material to remove
   * Used in parameter chemical material management
   */
  removeParameterChemicalMaterialById: (id: string) =>
    Effect.gen(function* () {
      const isExist =
        yield* parameterChemicalMaterialsQueries.getParameterChemicalMaterialById(
          id,
        );

      if (!isExist) {
        return Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Data bahan kimia untuk parameter tidak ditemukan.",
          }),
        );
      }

      const [deletedRecord] = yield* Effect.tryPromise({
        try: () =>
          db
            .delete(parameterChemicalMaterials)
            .where(eq(parameterChemicalMaterials.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterChemicalMaterialQueries.removeParameterChemicalMaterialById",
            "Failed to remove parameter chemical material by ID",
            { id, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus bahan kimia untuk parameter.",
          });
        },
      });

      if (!deletedRecord) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus bahan kimia untuk parameter.",
          }),
        );
      }

      return deletedRecord;
    }),
};

export default parameterChemicalMaterialsQueries;
