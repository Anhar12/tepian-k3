import rolesQueries from "@tepian-k3/queries/platform/roles.queries";
import { createTRPCRouter, withPermission } from "../..";
import z from "zod";
import rolesSchema from "@tepian-k3/schema/platform/role.schema";
import { runEffect } from "../../utils/run-effect";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";

export const roleRouters = createTRPCRouter({
  getAllRoles: withPermission("roles.view").query(
    async () =>
      await withCache(CACHE_KEYS.ROLES_ALL, CACHE_TTL.LONG, () =>
        runEffect(rolesQueries.getAllRoles()),
      ),
  ),

  getRoleById: withPermission("roles.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) => await runEffect(rolesQueries.getRoleById(input.id)),
    ),

  getRoleWithPermissionsById: withPermission("roles.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(rolesQueries.getRoleWithPermissionsById(input.id)),
    ),

  getPaginatedRoles: withPermission("roles.view")
    .input(rolesSchema.getAllRolesSchema)
    .query(
      async ({ input }) =>
        await runEffect(rolesQueries.getOffsetPaginatedRoles(input)),
    ),

  // createRole: withPermission("roles.create")
  //   .input(rolesSchema.createRoleSchema)
  //   .mutation(
  //     async ({ input }) =>
  //       await withCacheInvalidation(CACHE_KEYS.ROLES_PREFIX, () =>
  //         runEffect(rolesQueries.createRole(input)),
  //       ),
  //   ),

  updateRole: withPermission("roles.update")
    .input(rolesSchema.updateRoleSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.ROLES_PREFIX, () =>
          runEffect(rolesQueries.updateRole(input)),
        ),
    ),

  deleteRole: withPermission("roles.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.ROLES_PREFIX, () =>
          runEffect(rolesQueries.deleteRole(input.id)),
        ),
    ),

  restoreRole: withPermission("roles.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.ROLES_PREFIX, () =>
          runEffect(rolesQueries.restoreRole(input.id)),
        ),
    ),
});
