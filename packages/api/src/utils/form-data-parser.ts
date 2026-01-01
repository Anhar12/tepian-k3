import { z } from "zod";

/**
 * Prefix used to mark strings that should not be coerced to numbers
 */
const STRING_PREFIX = "__str__";

/**
 * Coerces a string value to its appropriate type
 * Handles booleans, numbers, and keeps strings as-is
 */
function coerceValue(value: string | File): any {
  // Keep File/Blob as-is
  if (value instanceof File) {
    return value;
  }

  const strValue = String(value);

  // Check for preserved string prefix (numeric strings that should stay as strings)
  if (strValue.startsWith(STRING_PREFIX)) {
    return strValue.slice(STRING_PREFIX.length);
  }

  // Handle booleans
  if (strValue === "true") return true;
  if (strValue === "false") return false;

  // Handle empty strings
  if (strValue === "") return "";

  // Handle numbers (but not strings that start with 0 like "007")
  if (/^-?\d+(\.\d+)?$/.test(strValue) && !strValue.startsWith("0")) {
    const num = Number(strValue);
    if (!isNaN(num)) return num;
  }

  // Handle numbers that start with 0 but are just "0"
  if (strValue === "0") return 0;

  return strValue;
}

/**
 * Parses FormData into a structured object
 * Handles arrays (field[]), nested objects (field.nested), and files
 */
export function parseFormData(formData: FormData): Record<string, any> {
  const result: Record<string, any> = {};

  formData.forEach((value, key) => {
    const coercedValue = coerceValue(value);

    // Handle array notation: field[]
    if (key.endsWith("[]")) {
      const cleanKey = key.slice(0, -2);
      if (!result[cleanKey]) {
        result[cleanKey] = [];
      }
      result[cleanKey].push(coercedValue);
      return;
    }

    // Handle nested notation: field.nested or field[0]
    if (key.includes(".") || key.includes("[")) {
      setNestedValue(result, key, coercedValue);
      return;
    }

    // Check if key already exists (multiple values with same name)
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(coercedValue);
      } else {
        result[key] = [result[key], coercedValue];
      }
    } else {
      result[key] = coercedValue;
    }
  });

  return result;
}

function setNestedValue(
  obj: Record<string, any>,
  path: string,
  value: any
): void {
  const keys = path.match(/[^.\[\]]+/g) || [];
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (key !== undefined && nextKey !== undefined && !current[key]) {
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    if (key !== undefined) {
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey !== undefined) {
    if (current[lastKey]) {
      if (Array.isArray(current[lastKey])) {
        current[lastKey].push(value);
      } else {
        current[lastKey] = [current[lastKey], value];
      }
    } else {
      current[lastKey] = value;
    }
  }
}

export function parseAndValidate<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T
): z.infer<T> {
  const parsed = parseFormData(formData);
  return schema.parse(parsed);
}

export function parseAndValidateSafe<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const parsed = parseFormData(formData);
  const result = schema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
