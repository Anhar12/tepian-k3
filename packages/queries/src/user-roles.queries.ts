import { db } from "@tepian-k3/db/client";
import { userRoles } from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const userRolesQueries = {
  assignRoleToUser(userId: string, roleId: string) {
    return Effect.tryPromise({
      try: () => db.insert(userRoles).values({ userId, roleId }).returning(),
      catch: (error) => {
        logger.error(
          `Error assigning role ${roleId} to user ${userId}:`,
          error
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign role to user.",
          cause: error,
        });
      },
    });
  },
};

export default userRolesQueries;
