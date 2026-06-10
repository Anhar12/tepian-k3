import { getBaseUrl } from "./get-base-url";

export const getPublicUrl = (key: string): string => {
  if (!key) return "";
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("data:") ||
    key.startsWith("/")
  ) {
    return key;
  }
  const path = `/api/uploads/${key.replace(/^\/+/, "")}`;
  return `${getBaseUrl()}${path}`;
};
