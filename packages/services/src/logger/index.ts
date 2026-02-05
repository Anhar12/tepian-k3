import winston from "winston";
import { logLevels, getLogLevel } from "./config";
import { getLogFormat } from "./formatters";
import { getTransports } from "./transports";
import { sanitizeLogContext, sanitizeError } from "./sanitizer";

// Create the logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  format: getLogFormat(),
  transports: getTransports(),
  exitOnError: false,
});

// Create a stream for Morgan (HTTP logging middleware)
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging with automatic sanitization
const logWithContext = (
  level: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  // Sanitize context to remove sensitive data
  const sanitizedContext = sanitizeLogContext(context);

  // Winston expects metadata to be passed as the third argument
  // Use the splat format or pass metadata directly
  if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
    logger.log({ level, message, ...sanitizedContext });
  } else {
    logger.log({ level, message });
  }
};

const logInfo = (
  service: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  logWithContext("info", `[${service}] ${message}`, context);
};

const logError = (
  service: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  // If context contains an error, sanitize it
  const sanitizedContext = context
    ? {
        ...context,
        ...(context.error ? { error: sanitizeError(context.error) } : {}),
      }
    : undefined;
  logWithContext("error", `[${service}] ${message}`, sanitizedContext);
};

const logDebug = (
  service: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  logWithContext("debug", `[${service}] ${message}`, context);
};

const logWarn = (
  service: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  logWithContext("warn", `[${service}] ${message}`, context);
};

export {
  logger,
  stream,
  logWithContext,
  logInfo,
  logError,
  logDebug,
  logWarn,
  sanitizeLogContext,
  sanitizeError,
};
