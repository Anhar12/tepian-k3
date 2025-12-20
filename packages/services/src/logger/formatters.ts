import winston from "winston";
import { Format } from "logform";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Development format - pretty and colorful
export const devFormat: Format = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return msg;
  })
);

// Production format - JSON for log aggregation
export const prodFormat: Format = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Get format based on environment
export const getLogFormat = (): Format => {
  const env = process.env.NODE_ENV || "development";
  return env === "production" ? prodFormat : devFormat;
};
