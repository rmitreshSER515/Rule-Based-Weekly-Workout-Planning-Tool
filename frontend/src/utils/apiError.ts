/** NestJS often returns `message` as string or string[]. */
export function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const msg = (data as { message?: unknown }).message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === "string") {
    return msg[0];
  }
  return fallback;
}
