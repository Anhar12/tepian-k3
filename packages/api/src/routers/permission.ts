import permissionsQueries from "@tepian-k3/queries/permission.queries";
import { createTRPCRouter, withPermission } from "..";
import z from "zod";
import { runEffect } from "../utils/run-effect";

export const permissionRouters = createTRPCRouter({
  getAllPermissions: withPermission("permissions.read").query(async () => {
    return await runEffect(permissionsQueries.getAllPermissions());
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
        await runEffect(
          permissionsQueries.updateRolePermissions(
            input.roleId,
            input.addedPermissions,
            input.removedPermissions
          )
        )
    ),
});
