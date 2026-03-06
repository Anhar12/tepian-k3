import auditQueries from "../platform/audit.queries";
import type { AuditEntityType } from "@tepian-k3/types/platform/audit.types";
import { Effect } from "effect";

/**
 * Helper functions to make audit logging easier in other queries
 * These helpers wrap the audit queries with a simpler API
 */

/**
 * Log a create action
 */
export const logCreate = (
  entityType: AuditEntityType,
  entityId: string,
  newValues: Record<string, unknown>,
  userId?: string,
  userEmail?: string,
  metadata?: Record<string, unknown>,
) =>
  auditQueries.createAuditLog({
    entityType,
    entityId,
    action: "create",
    userId,
    userEmail,
    newValues,
    metadata,
    description: `Created ${entityType} ${entityId}`,
  });

/**
 * Log an update action
 */
export const logUpdate = (
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  userId?: string,
  userEmail?: string,
  metadata?: Record<string, unknown>,
) =>
  auditQueries.createAuditLog({
    entityType,
    entityId,
    action: "update",
    userId,
    userEmail,
    oldValues,
    newValues,
    metadata,
  });

/**
 * Log a delete action
 */
export const logDelete = (
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, unknown>,
  userId?: string,
  userEmail?: string,
  metadata?: Record<string, unknown>,
) =>
  auditQueries.createAuditLog({
    entityType,
    entityId,
    action: "delete",
    userId,
    userEmail,
    oldValues,
    metadata,
    description: `Deleted ${entityType} ${entityId}`,
  });

/**
 * Log a status change (specialized update)
 */
export const logStatusChange = (
  entityType: AuditEntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string,
  userEmail?: string,
  metadata?: Record<string, unknown>,
) =>
  auditQueries.createAuditLog({
    entityType,
    entityId,
    action: "status_change",
    userId,
    userEmail,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    metadata,
    description: `Status changed from "${oldStatus}" to "${newStatus}"`,
  });

/**
 * Run an audit effect and catch errors
 * Audit failures shouldn't break the main operation
 */
export const runAuditSafe = <T>(
  effect: Effect.Effect<T, Error, never>,
): Promise<T | null> =>
  Effect.runPromise(effect).catch((error) => {
    console.error("Audit logging failed:", error);
    return null;
  });

/**
 * Wrap an Effect with audit logging
 * This allows you to add audit logging to any operation without changing the main logic
 */
export const withAudit = <T, E, R>(
  effect: Effect.Effect<T, E, R>,
  auditEffect: Effect.Effect<unknown, Error, never>,
): Effect.Effect<T, E, R> =>
  Effect.gen(function* () {
    // Run the main effect
    const result = yield* effect;

    // Run audit logging (fire and forget, don't block on errors)
    Effect.runFork(auditEffect.pipe(Effect.catchAll(() => Effect.void)));

    return result;
  });
