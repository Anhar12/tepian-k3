/**
 * Generates a date-based storage path
 * @param prefix - The folder prefix (e.g., "avatars", "documents", "invoices")
 * @returns Path like "avatars/2026/01/09"
 */
export function generateDateBasedPath(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${prefix}/${year}/${month}/${day}`;
}
