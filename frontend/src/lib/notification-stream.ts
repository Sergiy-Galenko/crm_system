/**
 * In-memory registry that maps userId → SSE stream controller.
 * Lives in the Next.js Node.js process. Uses a module-level singleton so
 * it survives across requests in the same server process.
 */

export type SsePayload = {
  id: string;
  title: string;
  body: string;
  createdAt: string; // ISO string
};

type Controller = ReadableStreamDefaultController<Uint8Array>;

// Keyed by userId. One connection per user (latest wins).
const streams = new Map<string, Controller>();

export function registerStream(userId: string, controller: Controller) {
  streams.set(userId, controller);
}

export function unregisterStream(userId: string) {
  streams.delete(userId);
}

export function pushNotification(userId: string, payload: SsePayload): boolean {
  const controller = streams.get(userId);
  if (!controller) return false;

  try {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    controller.enqueue(new TextEncoder().encode(data));
    return true;
  } catch {
    // Stream may have been closed already
    streams.delete(userId);
    return false;
  }
}
