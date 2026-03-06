import { getBaseUrl } from "./get-base-url";

export const getPublicUrl = (key: string): string => {
  const path = `/api/uploads/${key.replace(/^\/+/, "")}`;
  return `${getBaseUrl()}${path}`;
};
