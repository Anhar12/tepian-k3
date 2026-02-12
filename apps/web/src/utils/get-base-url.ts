import { env } from "@/env";

export const getBaseUrl = (): string => {
  return import.meta.env.DEV ? "" : env.VITE_SERVER_URL;
};
