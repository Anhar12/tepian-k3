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
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
export const logWithContext = (
  level: string,
  message: string,
  context?: Record<string, any>
) => {
  logger.log(level, message, context);
};

// Export logger instance
export { logger };
export default logger;
