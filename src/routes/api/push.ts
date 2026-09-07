import { createFileRoute } from "@tanstack/react-router";
import speciesFile from "@/data/species.json";
import { getSql } from "@/lib/db";

const PUBLIC_KEY =
  "BIjqLyv-BuXXCGt0uoUQlBe4bg4Feb3tmyowTDXy2o2bIyA2a5IohJU4uExWcMrUFb206KKKpXz1xBkShr8cLNc";
const PRIVATE_KEY = "b5rMRM3e2RSxoZ9Z8ZHAXvSDe-B5eD7Ve-in_rJfKl4";

type Sub = { endpoint: string; keys?: { p256dh: string; auth: string } };
type Sp = {
  name: string;
  closed: { from: string; to: string }[];
  seaClosed?: { from: string; to: string }[];
};
const SPECIES = speciesFile as Sp[];
const subs = new Map<string, Sub>();

function isClosedNow(from: string, to: string, at: Date) {
  const n = (at.getMonth() + 1) * 100 + at.getDate();
  const a = Number(from.replace("-", ""));
  const b = Number(to.replace("-", ""));
  return a <= b ? n >= a && n <= b : n >= a || n <= b;
}

function closedEndingDays(sp: Sp, at = new Date()): number | null {
  const periods = [...sp.closed, ...(sp.seaClosed ?? [])];
  if (!periods.length) return null;
  const y = at.getFullYear();
  let best: number | null = null;
  for (const c of periods) {
    if (!isClosedNow(c.from, c.to, at)) continue;
    const [tm, td] = c.to.split("-").map(Number);
    let end = new Date(y, (tm ?? 1) - 1, td ?? 1, 23, 59, 59);
    if (end < at) end = new Date(y + 1, (tm ?? 1) - 1, td ?? 1, 23, 59, 59);
    const days = Math.ceil((end.getTime() - at.getTime()) / 86_400_000);
    if (days >= 0 && (best == null || days < best)) best = days;
  }
  return best;
}

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

async function webPush() {
  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails("mailto:atlas@atlaswedkarski.pl", PUBLIC_KEY, PRIVATE_KEY);
  return webpush;
}

async function loadSubs() {
  try {
    const sql = await getSql();
    const rows = await sql.query<{
      endpoint: string;
      p256dh: string | null;
      auth: string | null;
    }>("select endpoint, p256dh, auth from push_subs");
    for (const r of rows) {
      subs.set(r.endpoint, {
        endpoint: r.endpoint,
        keys:
          r.p256dh && r.auth ? { p256dh: r.p256dh, auth: r.auth } : undefined,
      });
    }
  } catch {
    /* no db */
  }
}

async function saveSub(s: Sub) {
  subs.set(s.endpoint, s);
  try {
    const sql = await getSql();
    await sql.query(
      `insert into push_subs (endpoint, p256dh, auth, updated_at)
       values ($1, $2, $3, now())
       on conflict (endpoint) do update
         set p256dh = excluded.p256dh, auth = excluded.auth, updated_at = now()`,
      [s.endpoint, s.keys?.p256dh ?? null, s.keys?.auth ?? null],
    );
  } catch {
    /* memory */
  }
}

async function sendAll(payload: { title: string; body: string; tag?: string }) {
  await loadSubs();
  const webpush = await webPush();
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

async function tick() {
  const due = tarloBody();
  if (due) await sendAll(due);
  return Boolean(due);
}

export const Route = createFileRoute("/api/push")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const ua = request.headers.get("user-agent") ?? "";
        const cron =
          url.searchParams.get("tick") === "1" || /vercel-cron/i.test(ua);
        if (cron) await tick();
        return Response.json({ publicKey: PUBLIC_KEY, n: subs.size });
      },
      POST: async ({ request }) => {
        let body: { sub?: Sub; tick?: boolean } = {};
        try {
          body = (await request.json()) as { sub?: Sub; tick?: boolean };
        } catch {
          body = {};
        }
        if (body.sub?.endpoint) {
          await saveSub(body.sub);
          const due = tarloBody();
          if (due) void sendAll(due);
          return Response.json({ ok: true, n: subs.size });
        }
        if (body.tick) {
          const sent = await tick();
          return Response.json({ ok: true, sent, n: subs.size });
        }
        return Response.json({ ok: false }, { status: 400 });
      },
    },
  },
});
