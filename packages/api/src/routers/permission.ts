import permissionsQueries from "@tepian-k3/queries/permission.queries";
import { createTRPCRouter, withPermission } from "..";
import z from "zod";
import { runEffect } from "../utils/run-effect";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../utils/cache-helper";

export const permissionRouters = createTRPCRouter({
  getAllPermissions: withPermission("permissions.view").query(
    async () =>
      await withCache(CACHE_KEYS.PERMISSIONS_ALL, CACHE_TTL.LONG, () =>
        runEffect(permissionsQueries.getAllPermissions()),
      ),
  ),

  updateRolePermissions: withPermission("roles.update")
    .input(
      z.object({
        roleId: z.uuidv7(),
        addedPermissions: z.array(z.string()),
        removedPermissions: z.array(z.string()),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          [CACHE_KEYS.PERMISSIONS_PREFIX, CACHE_KEYS.ROLES_PREFIX],
          () =>
            runEffect(
              permissionsQueries.updateRolePermissions(
                input.roleId,
                input.addedPermissions,
                input.removedPermissions,
              ),
            ),
        ),
    ),
});
