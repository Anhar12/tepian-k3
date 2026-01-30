// packages/queries/src/audit.queries.ts

import { db } from "@tepian-k3/db/client";
import { audits } from "@tepian-k3/db/schema";
import type { AuditLogOptions } from "@tepian-k3/types/audit.types";
import {
  compareObjects,
  getChangedFieldNames,
  generateChangeDescription,
} from "@tepian-k3/utils/audit";
import { logError, logInfo } from "@tepian-k3/services/logger";
import { Effect } from "effect";
import { eq, and, desc, sql, type SQL } from "@tepian-k3/db";
import type { AuditAction } from "@tepian-k3/constants";
import { TRPCError } from "@trpc/server";

/**
 * Create an audit log entry
 */
const createAuditLog = (options: AuditLogOptions) =>
  Effect.gen(function* () {
    const {
      entityType,
      entityId,
      action,
      userId,
      userEmail,
      oldValues,
      newValues,
      metadata,
      description,
    } = options;

    // Calculate differences if both old and new values provided
    const diff = compareObjects(oldValues || null, newValues || null);
    const changedFields = diff.changed ? getChangedFieldNames(diff) : [];
    const autoDescription = diff.changed
      ? generateChangeDescription(diff)
      : description;

    const [audit] = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(audits)
          .values({
            entityType,
            entityId,
            action,
            userId: userId || null,
            userEmail: userEmail || null,
            oldValues: oldValues || null,
            newValues: newValues || null,
            changedFields: changedFields.length > 0 ? changedFields : null,
            metadata: metadata || null,
            description: autoDescription || null,
          })
          .returning(),
      catch: (error) => {
        logError("auditQueries.createAuditLog", "Failed to create audit log", {
          error,
          options,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create audit log",
        });
      },
    });

    if (!audit) {
      return yield* Effect.fail(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create audit log",
        })
      );
    }

    logInfo("auditQueries.createAuditLog", "Audit log created", {
      auditId: audit.id,
      entityType,
      entityId,
      action,
      userId,
    });

    return audit;
  });

/**
 * Get audit logs for a specific entity
 */
const getAuditLogsByEntity = (entityType: string, entityId: string) =>
  Effect.gen(function* () {
    const logs = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(audits)
          .where(
            and(
              eq(audits.entityType, entityType),
              eq(audits.entityId, entityId)
            )
          )
          .orderBy(desc(audits.createdAt)),
      catch: (error) => {
        logError(
          "auditQueries.getAuditLogsByEntity",
          "Failed to get audit logs by entity",
          {
            error,
            entityType,
            entityId,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get audit logs",
        });
      },
    });

    return logs;
  });

/**
 * Get audit logs by user
 */
const getAuditLogsByUser = (userId: string, limit: number = 100) =>
  Effect.gen(function* () {
    const logs = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(audits)
          .where(eq(audits.userId, userId))
          .orderBy(desc(audits.createdAt))
          .limit(limit),
      catch: (error) => {
        logError(
          "auditQueries.getAuditLogsByUser",
          "Failed to get audit logs by user",
          {
            error,
            userId,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get audit logs",
        });
      },
    });

    return logs;
  });

/**
 * Get recent audit logs with filters
 */
interface AuditLogFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

const getAuditLogs = (filters: AuditLogFilters = {}) =>
  Effect.gen(function* () {
    const {
      entityType,
      action,
      userId,
      startDate,
      endDate,
      limit = 100,
    } = filters;

    const conditions: SQL[] = [];

    if (entityType) {
      conditions.push(eq(audits.entityType, entityType));
    }

    if (action) {
      conditions.push(eq(audits.action, action as AuditAction));
    }

    if (userId) {
      conditions.push(eq(audits.userId, userId));
    }

    if (startDate) {
      conditions.push(sql`${audits.createdAt} >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`${audits.createdAt} <= ${endDate}`);
    }

    const logs = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(audits)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(audits.createdAt))
          .limit(limit),
      catch: (error) => {
        logError("auditQueries.getAuditLogs", "Failed to get audit logs", {
          error,
          filters,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get audit logs",
        });
      },
    });

    return logs;
  });

/**
 * Get audit statistics
 */
const getAuditStatistics = (entityType?: string) =>
  Effect.gen(function* () {
    const conditions = entityType ? [eq(audits.entityType, entityType)] : [];

    const [stats] = yield* Effect.tryPromise({
      try: () =>
        db
          .select({
            totalLogs: sql<number>`count(*)::int`,
            createCount: sql<number>`count(*) filter (where action = 'create')::int`,
            updateCount: sql<number>`count(*) filter (where action = 'update')::int`,
            deleteCount: sql<number>`count(*) filter (where action = 'delete')::int`,
            statusChangeCount: sql<number>`count(*) filter (where action = 'status_change')::int`,
          })
          .from(audits)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      catch: (error) => {
        logError(
          "auditQueries.getAuditStatistics",
          "Failed to get audit statistics",
          { error, entityType }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get audit statistics",
        });
      },
    });

    return stats;
  });

/**
 * Delete old audit logs (for cleanup)
 */
const deleteOldAuditLogs = (olderThanDays: number) =>
  Effect.gen(function* () {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = yield* Effect.tryPromise({
      try: () =>
        db
          .delete(audits)
          .where(sql`${audits.createdAt} < ${cutoffDate}`)
          .returning(),
      catch: (error) => {
        logError(
          "auditQueries.deleteOldAuditLogs",
          "Failed to delete old audit logs",
          {
            error,
            olderThanDays,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete old audit logs",
        });
      },
    });

    logInfo("auditQueries.deleteOldAuditLogs", "Deleted old audit logs", {
      olderThanDays,
      cutoffDate,
    });

    return result;
  });

const auditQueries = {
  createAuditLog,
  getAuditLogsByEntity,
  getAuditLogsByUser,
  getAuditLogs,
  getAuditStatistics,
  deleteOldAuditLogs,
};

export default auditQueries;
