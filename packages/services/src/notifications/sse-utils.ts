/**
 * Format data as an SSE message
 */
export function formatSSEMessage(event: string, data: unknown): string {
  const jsonData = JSON.stringify(data, (_key, value) => {
    // Handle Date serialization
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
  return `event: ${event}\ndata: ${jsonData}\n\n`;
}

/**
 * Create SSE headers for response
 */
export function getSSEHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  };
}

/**
 * Parse SSE message from raw string
 */
export function parseSSEMessage(
  raw: string
): { event: string; data: unknown } | null {
  const lines = raw.split("\n");
  let event = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      event = line.slice(7);
    } else if (line.startsWith("data: ")) {
      data = line.slice(6);
    }
  }

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) };
  } catch {
    return { event, data };
  }
}
