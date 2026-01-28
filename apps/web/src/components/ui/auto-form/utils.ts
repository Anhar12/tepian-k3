import type { z } from "zod";
import type { InferredFieldType } from "./types";

interface WrapperDef {
  type: "optional" | "nullable" | "default";
  innerType: z.ZodType;
  defaultValue?: unknown;
}

/**
 * Unwrap Zod wrapper types (optional, nullable, default) to get the inner type.
 */
export function unwrapZodType(zodType: z.ZodType): z.ZodType {
  const def = zodType._zod?.def as z.core.$ZodTypeDef | undefined;
  if (!def) return zodType;

  if (
    def.type === "optional" ||
    def.type === "nullable" ||
    def.type === "default"
  ) {
    return unwrapZodType((def as WrapperDef).innerType);
  }

  return zodType;
}

/**
 * Check if a Zod type is optional (wrapped in ZodOptional or ZodNullable or has default).
 */
export function isZodOptional(zodType: z.ZodType): boolean {
  const def = zodType._zod?.def as z.core.$ZodTypeDef | undefined;
  if (!def) return false;

  if (
    def.type === "optional" ||
    def.type === "nullable" ||
    def.type === "default"
  ) {
    return true;
  }

  return false;
}

/**
 * Infer the form field type from a Zod schema type.
 */
export function inferFieldType(zodType: z.ZodType): InferredFieldType {
  const inner = unwrapZodType(zodType);
  const def = inner._zod?.def as z.core.$ZodTypeDef | undefined;
  if (!def) return "text";

  switch (def.type) {
    case "boolean":
      return "checkbox";
    case "enum":
      return "select";
    case "date":
      return "date";
    case "number":
      return "number";
    case "string": {
      const checks = def.checks ?? [];
      for (const check of checks) {
        const checkDef = check._zod.def as z.core.$ZodCheckDef & {
          format?: string;
          minLength?: number;
        };
        if (checkDef.format === "email") return "email";
        if (checkDef.format === "url") return "url";
        if (checkDef.minLength && checkDef.minLength >= 50) return "textarea";
      }
      return "text";
    }
    default:
      return "text";
  }
}

/**
 * Extract enum values from a ZodEnum type.
 */
export function extractEnumValues(zodType: z.ZodType): string[] | undefined {
  const inner = unwrapZodType(zodType);
  const def = inner._zod?.def as z.core.$ZodTypeDef & {
    entries?: Record<string, unknown>;
  };
  if (!def || def.type !== "enum") return undefined;

  if (def.entries && typeof def.entries === "object") {
    return Object.keys(def.entries);
  }

  return undefined;
}

/**
 * Extract default value from a Zod type if it has one.
 */
export function extractDefaultValue(zodType: z.ZodType): unknown | undefined {
  const def = zodType._zod?.def as z.core.$ZodTypeDef | undefined;
  if (!def) return undefined;

  if (def.type === "default") {
    return (def as WrapperDef).defaultValue;
  }

  return undefined;
}

/**
 * Convert a camelCase or snake_case key to a human-readable label.
 * e.g. "firstName" → "First Name", "created_at" → "Created At"
 */
export function keyToLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
