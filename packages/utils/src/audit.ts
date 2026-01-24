import type { AuditDiff, FieldChange } from "@tepian-k3/types/audit.types";

/**
 * Compare two objects and return the differences
 */
export function compareObjects(
  oldObj: Record<string, unknown> | null | undefined,
  newObj: Record<string, unknown> | null | undefined
): AuditDiff {
  const changes: FieldChange[] = [];
  const addedFields: string[] = [];
  const removedFields: string[] = [];

  // Handle null/undefined cases
  if (!oldObj && !newObj) {
    return { changed: false, fields: [], addedFields: [], removedFields: [] };
  }

  if (!oldObj && newObj) {
    return {
      changed: true,
      fields: Object.keys(newObj).map((key) => ({
        field: key,
        oldValue: null,
        newValue: newObj[key],
      })),
      addedFields: Object.keys(newObj),
      removedFields: [],
    };
  }

  if (oldObj && !newObj) {
    return {
      changed: true,
      fields: Object.keys(oldObj).map((key) => ({
        field: key,
        oldValue: oldObj[key],
        newValue: null,
      })),
      addedFields: [],
      removedFields: Object.keys(oldObj),
    };
  }

  // Both objects exist
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  for (const key of allKeys) {
    const oldValue = oldObj![key];
    const newValue = newObj![key];

    // Skip comparison for certain fields
    if (shouldSkipField(key)) {
      continue;
    }

    // Check if field was added
    if (!(key in oldObj!) && key in newObj!) {
      addedFields.push(key);
      changes.push({ field: key, oldValue: null, newValue });
      continue;
    }

    // Check if field was removed
    if (key in oldObj! && !(key in newObj!)) {
      removedFields.push(key);
      changes.push({ field: key, oldValue, newValue: null });
      continue;
    }

    // Compare values
    if (!deepEqual(oldValue, newValue)) {
      changes.push({ field: key, oldValue, newValue });
    }
  }

  return {
    changed: changes.length > 0,
    fields: changes,
    addedFields,
    removedFields,
  };
}

/**
 * Check if a field should be skipped in audit comparison
 */
function shouldSkipField(fieldName: string): boolean {
  const skipFields = [
    "updatedAt",
    "updated_at",
    "lastModified",
    "last_modified",
  ];
  return skipFields.includes(fieldName);
}

/**
 * Deep equality check for values
 */
function deepEqual(value1: unknown, value2: unknown): boolean {
  // Handle primitives
  if (value1 === value2) return true;

  // Handle null/undefined
  if (value1 == null || value2 == null) return value1 === value2;

  // Handle dates
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime();
  }

  // Handle arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    return value1.every((item, index) => deepEqual(item, value2[index]));
  }

  // Handle objects
  if (typeof value1 === "object" && typeof value2 === "object") {
    const keys1 = Object.keys(value1 as object);
    const keys2 = Object.keys(value2 as object);

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) =>
      deepEqual(
        (value1 as Record<string, unknown>)[key],
        (value2 as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

/**
 * Generate a human-readable description of changes
 */
export function generateChangeDescription(diff: AuditDiff): string {
  if (!diff.changed) return "No changes";

  const descriptions: string[] = [];

  if (diff.addedFields.length > 0) {
    descriptions.push(`Added: ${diff.addedFields.join(", ")}`);
  }

  if (diff.removedFields.length > 0) {
    descriptions.push(`Removed: ${diff.removedFields.join(", ")}`);
  }

  const modifiedFields = diff.fields.filter(
    (f) =>
      !diff.addedFields.includes(f.field) &&
      !diff.removedFields.includes(f.field)
  );

  if (modifiedFields.length > 0) {
    descriptions.push(
      `Modified: ${modifiedFields.map((f) => f.field).join(", ")}`
    );
  }

  return descriptions.join("; ");
}

/**
 * Format a value for display in audit logs
 */
export function formatAuditValue(value: unknown): string {
  if (value == null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Get changed field names from diff
 */
export function getChangedFieldNames(diff: AuditDiff): string[] {
  return diff.fields.map((f) => f.field);
}
