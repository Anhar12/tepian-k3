import { eq } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { roles } from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const rolesQueries = {
  getAllRoles() {
    return Effect.tryPromise({
      try: () => db.query.roles.findMany(),
      catch: (error) => {
        logger.error("Error fetching roles:", error);
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch roles.",
          cause: error,
        });
      },
    });
  },

  getRoleById(roleId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.roles.findFirst({
          where: eq(roles.id, roleId),
        }),
      catch: (error) => {
        logger.error(`Error fetching role with ID ${roleId}:`, error);
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch role.",
          cause: error,
        });
      },
    }).pipe(
      Effect.flatMap((role) =>
        role
          ? Effect.succeed(role)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: `Role with ID ${roleId} not found.`,
              })
            )
      )
    );
  },
};

export default rolesQueries;
