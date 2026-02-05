import { env } from "@/env";

export const getPublicUrl = (key: string): string => {
  const path = `/api/uploads/${key.replace(/^\/+/, "")}`;
  // In development, use relative URL so Vite proxy handles it (avoids CORS issues)
  // In production, use full server URL
  return import.meta.env.DEV ? path : `${env.VITE_SERVER_URL}${path}`;
};
