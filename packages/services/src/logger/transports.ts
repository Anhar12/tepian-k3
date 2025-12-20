import winston from "winston";
import path from "path";

// Get app name from environment or default
const appName = process.env.APP_NAME || "server";

// Use app's own logs directory
const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), "logs");

// Console transport
export const consoleTransport = new winston.transports.Console({
  handleExceptions: true,
});

// File transport for all logs
export const fileTransport = new winston.transports.File({
  filename: path.join(logsDir, `${appName}-combined.log`),
  maxsize: 5242880,
  maxFiles: 5,
});

// File transport for errors only
export const errorFileTransport = new winston.transports.File({
  filename: path.join(logsDir, `${appName}-error.log`),
  level: "error",
  maxsize: 5242880,
  maxFiles: 5,
});

// Get transports based on environment
export const getTransports = (): winston.transport[] => {
  const env = process.env.NODE_ENV || "development";

  if (env === "production") {
    return [consoleTransport, fileTransport, errorFileTransport];
  }

  // Development - console only
  return [consoleTransport];
};
