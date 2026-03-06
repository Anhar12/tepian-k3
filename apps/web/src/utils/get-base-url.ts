import { env } from "@/env";

export const getBaseUrl = (): string => {
  return env.VITE_SERVER_URL;
};
