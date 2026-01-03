import rolesQueries from "@tepian-k3/queries/roles.queries";
import { createTRPCRouter, withPermission } from "..";
import z from "zod";
import rolesSchema from "@tepian-k3/schema/role.schema";
import { runEffect } from "../utils/run-effect";

export const roleRouters = createTRPCRouter({
  getAllRoles: withPermission("roles.read").query(async () => {
    return await runEffect(rolesQueries.getAllRoles());
  }),

  getRoleById: withPermission("roles.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) => await runEffect(rolesQueries.getRoleById(input.id))
    ),

  getRoleWithPermissionsById: withPermission("roles.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await runEffect(rolesQueries.getRoleWithPermissionsById(input.id))
    ),

  getPaginatedRoles: withPermission("roles.read")
    .input(rolesSchema.getAllRolesSchema)
    .query(
      async ({ input }) =>
        await runEffect(rolesQueries.getOffsetPaginatedRoles(input))
    ),

  createRole: withPermission("roles.create")
    .input(rolesSchema.createRoleSchema)
    .mutation(
      async ({ input }) => await runEffect(rolesQueries.createRole(input))
    ),

  updateRole: withPermission("roles.update")
    .input(rolesSchema.updateRoleSchema)
    .mutation(
      async ({ input }) => await runEffect(rolesQueries.updateRole(input))
    ),

  deleteRole: withPermission("roles.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) => await runEffect(rolesQueries.deleteRole(input.id))
    ),

  restoreRole: withPermission("roles.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) => await runEffect(rolesQueries.restoreRole(input.id))
    ),
});
