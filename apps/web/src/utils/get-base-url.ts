import { env } from "@/env";

export const getBaseUrl = (): string => {
  // If explicitly set, use it (useful for dev against a remote server).
  // Otherwise return empty string so all API calls are relative to the
  // current origin — works with nginx proxy regardless of host IP.
  return env.VITE_SERVER_URL ?? "";
};
