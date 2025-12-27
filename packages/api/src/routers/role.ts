import rolesQueries from "@tepian-k3/queries/roles.queries";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";
import z from "zod";
import rolesSchema from "@tepian-k3/schema/role.schema";

export const roleRouters = createTRPCRouter({
  getAllRoles: withPermission("roles.read").query(async () => {
    return await Effect.runPromise(rolesQueries.getAllRoles());
  }),

  getRoleById: withPermission("roles.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await Effect.runPromise(rolesQueries.getRoleById(input.id))
    ),

  createRole: withPermission("roles.create")
    .input(rolesSchema.createRoleSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(rolesQueries.createRole(input))
    ),

  updateRole: withPermission("roles.update")
    .input(rolesSchema.updateRoleSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(rolesQueries.updateRole(input))
    ),

  deleteRole: withPermission("roles.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(rolesQueries.deleteRole(input.id))
    ),

  restoreRole: withPermission("roles.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(rolesQueries.restoreRole(input.id))
    ),
});
