import { env } from "@/env";

export const getPublicUrl = (key: string): string => {
  return `${env.VITE_SERVER_URL}/api/uploads/${key.replace(/^\/+/, "")}`;
};
