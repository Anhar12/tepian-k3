import { db } from "@tepian-k3/db/client";
import { userPermissions } from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const userPermissionsQueries = {
  // Grant permission to user (override)
  grantPermission(userId: string, permissionId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .insert(userPermissions)
          .values({
            userId,
            permissionId,
            granted: true,
          })
          .onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.permissionId],
            set: { granted: true },
          })
          .returning(),
      catch: (error) => {
        logError(
          "userPermissionsQueries.grantPermission",
          "Error granting permission to user",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memberikan izin ke user",
        });
      },
    });
  },

  // Revoke permission from user (override)
  revokePermission(userId: string, permissionId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .insert(userPermissions)
          .values({
            userId,
            permissionId,
            granted: false,
          })
          .onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.permissionId],
            set: { granted: false },
          })
          .returning(),
      catch: (error) => {
        logError(
          "userPermissionsQueries.revokePermission",
          "Error revoking permission from user",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mencabut izin dari user",
        });
      },
    });
  },
};

export default userPermissionsQueries;
