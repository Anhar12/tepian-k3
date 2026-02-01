import winston from "winston";
import { logLevels, getLogLevel } from "./config";
import { getLogFormat } from "./formatters";
import { getTransports } from "./transports";

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

// Helper methods for structured logging
const logWithContext = (
  level: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  // Winston expects metadata to be passed as the third argument
  // Use the splat format or pass metadata directly
  if (context && Object.keys(context).length > 0) {
    logger.log({ level, message, ...context });
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
  logWithContext("error", `[${service}] ${message}`, context);
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

export { logger, stream, logWithContext, logInfo, logError, logDebug, logWarn };
