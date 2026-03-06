import chemicalMaterialSchema from "@tepian-k3/schema/pengujian/chemical-material.schema";
import { createTRPCRouter, withPermission } from "../..";
import chemicalMaterialQueries from "@tepian-k3/queries/pengujian/chemical-material.queries";
import z from "zod";
import { runEffect } from "../../utils/run-effect";

export const chemicalMaterialRouter = createTRPCRouter({
  /**
   * Get all chemical materials (without pagination)
   */
  getAll: withPermission("chemical-materials.view").query(
    async () =>
      await runEffect(chemicalMaterialQueries.getAllChemicalMaterials()),
  ),

  /**
   * Get paginated chemical materials
   */
  getPaginated: withPermission("chemical-materials.view")
    .input(chemicalMaterialSchema.getAllChemicalMaterialsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        chemicalMaterialQueries.getOffsetPaginatedChemicalMaterials(input),
      );

      return { data, pageCount };
    }),

  /**
   * Get chemical material by ID
   */
  getById: withPermission("chemical-materials.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          chemicalMaterialQueries.getChemicalMaterialById(input.id),
        ),
    ),

  /**
   * Get chemical materials by parameter IDs
   */
  getByParameterIds: withPermission("chemical-materials.view")
    .input(chemicalMaterialSchema.getChemicalMaterialsByParameterIdsSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          chemicalMaterialQueries.getChemicalMaterialsByParameterIds(
            input.parameterIds,
          ),
        ),
    ),

  /**
   * Get chemical materials for worksheet
   * Returns chemical materials related to parameters in the worksheet
   */
  getForWorksheet: withPermission("chemical-materials.view")
    .input(chemicalMaterialSchema.getChemicalMaterialsForWorksheetSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          chemicalMaterialQueries.getChemicalMaterialsForWorksheet(
            input.worksheetId,
          ),
        ),
    ),

  /**
   * Create chemical material
   */
  create: withPermission("chemical-materials.create")
    .input(chemicalMaterialSchema.createChemicalMaterialSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(chemicalMaterialQueries.createChemicalMaterial(input)),
    ),

  /**
   * Update chemical material
   */
  update: withPermission("chemical-materials.update")
    .input(chemicalMaterialSchema.updateChemicalMaterialSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(chemicalMaterialQueries.updateChemicalMaterial(input)),
    ),

  /**
   * Delete chemical material (soft delete)
   */
  delete: withPermission("chemical-materials.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          chemicalMaterialQueries.deleteChemicalMaterial(input.id),
        ),
    ),

  /**
   * Restore chemical material
   */
  restore: withPermission("chemical-materials.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          chemicalMaterialQueries.restoreChemicalMaterial(input.id),
        ),
    ),
});
