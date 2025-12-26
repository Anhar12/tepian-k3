import rolesQueries from "@tepian-k3/queries/roles.queries";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";

export const roleRouters = createTRPCRouter({
  getAllRoles: withPermission("roles.read").query(async () => {
    return await Effect.runPromise(rolesQueries.getAllRoles());
  }),
});
