import parameterChemicalMaterialSchema from "@tepian-k3/schema/parameter-chemical-material.schema";
import { createTRPCRouter, withPermission } from "..";
import parameterChemicalMaterialQueries from "@tepian-k3/queries/parameter-chemical-material.queries";
import z from "zod";
import { runEffect } from "../utils/run-effect";

export const parameterChemicalMaterialRouter = createTRPCRouter({
  /**
   * Get all chemical materials by parameter ID
   */
  getAllChemicalMaterialsByParameterId: withPermission(
    "parameter-chemical-material.view",
  )
    .input(
      z.object({
        parameterId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          parameterChemicalMaterialQueries.getAllChemicalMaterialsByParameterId(
            input.parameterId,
          ),
        ),
    ),

  /**
   * Get parameter chemical material by ID
   */
  getParameterChemicalMaterialById: withPermission(
    "parameter-chemical-material.read",
  )
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          parameterChemicalMaterialQueries.getParameterChemicalMaterialById(
            input.id,
          ),
        ),
    ),

  /**
   * Assign chemical material to parameter
   */
  assignChemicalMaterialToParameter: withPermission(
    "parameter-chemical-material.create",
  )
    .input(
      parameterChemicalMaterialSchema.createParameterChemicalMaterialSchema,
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          parameterChemicalMaterialQueries.assignChemicalMaterialToParameter(
            input,
          ),
        ),
    ),

  /**
   * Update parameter chemical material
   */
  updateParameterChemicalMaterial: withPermission(
    "parameter-chemical-material.update",
  )
    .input(
      parameterChemicalMaterialSchema.updateParameterChemicalMaterialSchema,
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          parameterChemicalMaterialQueries.updateParameterChemicalMaterial(
            input,
          ),
        ),
    ),

  /**
   * Delete parameter chemical material
   */
  deleteParameterChemicalMaterial: withPermission(
    "parameter-chemical-material.delete",
  )
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          parameterChemicalMaterialQueries.removeParameterChemicalMaterialById(
            input.id,
          ),
        ),
    ),
});
