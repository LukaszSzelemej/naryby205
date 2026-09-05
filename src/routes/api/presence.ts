import { createFileRoute } from "@tanstack/react-router";

const beats = new Map<string, number>();
const TTL = 45_000;

function prune(now: number) {
  for (const [k, v] of beats) {
    if (now - v > TTL) beats.delete(k);
  }
}

export const Route = createFileRoute("/api/presence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let id = "";
        try {
          const body = (await request.json()) as { id?: unknown };
          if (typeof body.id === "string") id = body.id.slice(0, 80);
        } catch {
          id = "";
        }
        const now = Date.now();
        if (id) beats.set(id, now);
        prune(now);
        return Response.json({ n: Math.max(1, beats.size) });
      },
      GET: async () => {
        prune(Date.now());
        return Response.json({ n: Math.max(1, beats.size) });
      },
    },
  },
});
