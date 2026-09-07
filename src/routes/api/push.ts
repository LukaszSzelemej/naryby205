import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";
import { SPECIES, closedEndingDays } from "@/lib/catalog";

const PUBLIC_KEY =
  "BIjqLyv-BuXXCGt0uoUQlBe4bg4Feb3tmyowTDXy2o2bIyA2a5IohJU4uExWcMrUFb206KKKpXz1xBkShr8cLNc";
const PRIVATE_KEY = "b5rMRM3e2RSxoZ9Z8ZHAXvSDe-B5eD7Ve-in_rJfKl4";

webpush.setVapidDetails("mailto:atlas@atlaswedkarski.pl", PUBLIC_KEY, PRIVATE_KEY);

type Sub = { endpoint: string; keys?: { p256dh: string; auth: string } };
const subs = new Map<string, Sub>();

function tarloBody() {
  const hits = SPECIES.map((s) => {
    const d = closedEndingDays(s);
    return d != null && d <= 1 ? { name: s.name, days: d } : null;
  }).filter((x): x is { name: string; days: number } => x != null);
  if (!hits.length) return null;
  const body = hits
    .map((h) =>
      h.days === 0
        ? `${h.name}: ochrona kończy się dziś`
        : `${h.name}: ochrona kończy się jutro`,
    )
    .join(". ");
  return { title: "Atlas wędkarski — tarło", body, tag: "atlas-tarlo" };
}

async function sendAll(payload: { title: string; body: string; tag?: string }) {
  const json = JSON.stringify(payload);
  await Promise.all(
    [...subs.values()].map(async (s) => {
      try {
        await webpush.sendNotification(s, json);
      } catch {
        subs.delete(s.endpoint);
      }
    }),
  );
}

export const Route = createFileRoute("/api/push")({
  server: {
    handlers: {
      GET: async () => Response.json({ publicKey: PUBLIC_KEY, n: subs.size }),
      POST: async ({ request }) => {
        let body: { sub?: Sub; tick?: boolean } = {};
        try {
          body = (await request.json()) as { sub?: Sub; tick?: boolean };
        } catch {
          body = {};
        }
        if (body.sub?.endpoint) {
          subs.set(body.sub.endpoint, body.sub);
          const due = tarloBody();
          if (due) void sendAll(due);
          return Response.json({ ok: true, n: subs.size });
        }
        if (body.tick) {
          const due = tarloBody();
          if (due) await sendAll(due);
          return Response.json({ ok: true, sent: Boolean(due), n: subs.size });
        }
        return Response.json({ ok: false }, { status: 400 });
      },
    },
  },
});
