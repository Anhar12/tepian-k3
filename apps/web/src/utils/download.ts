/**
 * Decodes a base64-encoded file and opens it in a new browser tab.
 *
 * @param base64 - Base64-encoded file content
 * @param contentType - MIME type (e.g. "application/pdf")
 */
export function openBase64InNewTab(base64: string, contentType: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

/**
 * Decodes a base64-encoded file and triggers a browser download.
 *
 * @param base64 - Base64-encoded file content
 * @param filename - Name for the downloaded file (e.g. "offering-letter-001.pdf")
 * @param contentType - MIME type (e.g. "application/pdf")
 */
export function downloadBase64Pdf(
  base64: string,
  filename: string,
  contentType: string,
) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
