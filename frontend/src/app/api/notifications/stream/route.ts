import { NextRequest } from "next/server";
import { getSession } from "@backend/common/next/session";
import { registerStream, unregisterStream } from "@/lib/notification-stream";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.userId;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register this user's controller
      registerStream(userId, controller);

      // Send an initial "connected" event so the client knows it's live
      const connected = `event: connected\ndata: {"userId":"${userId}"}\n\n`;
      controller.enqueue(new TextEncoder().encode(connected));

      // Heartbeat every 25 seconds to keep the connection alive through
      // proxies and load balancers that time out idle connections.
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 25_000);

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unregisterStream(userId);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
