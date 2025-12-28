import permissionsQueries from "@tepian-k3/queries/permission.queries";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";
import z from "zod";

export const permissionRouters = createTRPCRouter({
  getAllPermissions: withPermission("permissions.read").query(async () => {
    return await Effect.runPromise(permissionsQueries.getAllPermissions());
  }),

  updateRolePermissions: withPermission("roles.update")
    .input(
      z.object({
        roleId: z.uuidv7(),
        addedPermissions: z.array(z.string()),
        removedPermissions: z.array(z.string()),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          permissionsQueries.updateRolePermissions(
            input.roleId,
            input.addedPermissions,
            input.removedPermissions
          )
        )
    ),
});
