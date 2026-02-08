/**
 * Log Sanitization Utility
 *
 * Masks sensitive data in log entries to prevent accidental exposure
 * of passwords, tokens, personal information, and other sensitive data.
 */

// Fields that should be completely masked
const SENSITIVE_FIELDS = [
  "password",
  "newPassword",
  "oldPassword",
  "passwordConfirmation",
  "newPasswordConfirm",
  "secret",
  "apiKey",
  "apiSecret",
  "accessToken",
  "refreshToken",
  "token",
  "jwt",
  "bearer",
  "authorization",
  "cookie",
  "sessionId",
  "otp",
  "pin",
  "cvv",
  "creditCard",
  "cardNumber",
  "ssn",
  "socialSecurityNumber",
] as const;

// Fields that should be partially masked (show first/last few chars)
const PARTIAL_MASK_FIELDS = [
  "email",
  "phone",
  "nik", // Indonesian ID number
  "npwp", // Tax ID
] as const;

// Token patterns to detect and mask
const TOKEN_PATTERNS = [
  /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g, // JWT tokens
  /[A-Za-z0-9-_]{20,}/g, // Generic long tokens
];

/**
 * Mask a string value completely
 */
function maskFully(value: string): string {
  if (!value || value.length === 0) return "***";
  return "***REDACTED***";
}

/**
 * Mask a string value partially (show first 2 and last 2 chars)
 */
function maskPartially(value: string): string {
  if (!value || value.length < 6) return "***";

  const first = value.slice(0, 2);
  const last = value.slice(-2);
  return `${first}***${last}`;
}

/**
 * Mask email addresses (show first 2 chars, domain visible)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return maskPartially(email);

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***@***";

  const maskedLocal =
    localPart.length > 2 ? `${localPart.slice(0, 2)}***` : "***";

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone numbers (show last 4 digits)
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return "***";

  const last4 = phone.slice(-4);
  return `***${last4}`;
}

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some((sensitive) =>
    lowerField.includes(sensitive.toLowerCase()),
  );
}

/**
 * Check if a field should be partially masked
 */
function isPartialMaskField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return PARTIAL_MASK_FIELDS.some((field) =>
    lowerField.includes(field.toLowerCase()),
  );
}

/**
 * Mask tokens in a string value
 */
function maskTokensInString(value: string): string {
  let result = value;
  for (const pattern of TOKEN_PATTERNS) {
    result = result.replace(pattern, (match) => {
      if (match.length > 10) {
        return `${match.slice(0, 6)}...${match.slice(-4)}`;
      }
      return "***TOKEN***";
    });
  }
  return result;
}

/**
 * Sanitize a single value based on field name
 */
function sanitizeValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle string values
  if (typeof value === "string") {
    const lowerKey = key.toLowerCase();

    // Fully mask sensitive fields
    if (isSensitiveField(key)) {
      return maskFully(value);
    }

    // Partially mask specific fields
    if (lowerKey.includes("email")) {
      return maskEmail(value);
    }
    if (lowerKey.includes("phone")) {
      return maskPhone(value);
    }
    if (isPartialMaskField(key)) {
      return maskPartially(value);
    }

    // Mask any tokens in the string
    return maskTokensInString(value);
  }

  // Recursively sanitize objects
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return value.map((item, index) => sanitizeValue(String(index), item));
    }
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

/**
 * Sanitize an object by masking sensitive fields
 */
export function sanitizeObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeValue(key, value);
  }

  return result;
}

/**
 * Sanitize log context before logging
 * This is the main function to use in the logger
 */
export function sanitizeLogContext(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  return sanitizeObject(context);
}

/**
 * Sanitize an error object for logging
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: maskTokensInString(error.message),
      stack:
        process.env.NODE_ENV === "development"
          ? error.stack
          : "***STACK_HIDDEN***",
    };
  }

  if (typeof error === "string") {
    return { message: maskTokensInString(error) };
  }

  return { message: "Unknown error" };
}

export default {
  sanitizeObject,
  sanitizeLogContext,
  sanitizeError,
  maskEmail,
  maskPhone,
  maskPartially,
  maskFully,
};
