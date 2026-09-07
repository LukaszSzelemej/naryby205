import { createFileRoute } from "@tanstack/react-router";
import speciesFile from "@/data/species.json";
import { getSql } from "@/lib/db";
import { fetchHydroSnapshot } from "@/lib/hydro";

const PUBLIC_KEY =
  "BIjqLyv-BuXXCGt0uoUQlBe4bg4Feb3tmyowTDXy2o2bIyA2a5IohJU4uExWcMrUFb206KKKpXz1xBkShr8cLNc";
const PRIVATE_KEY = "b5rMRM3e2RSxoZ9Z8ZHAXvSDe-B5eD7Ve-in_rJfKl4";

type Sub = { endpoint: string; keys?: { p256dh: string; auth: string }; tarlo?: boolean; hydro?: boolean };
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
    type SubRow = {
      endpoint: string;
      p256dh: string | null;
      auth: string | null;
      tarlo?: boolean | null;
      hydro?: boolean | null;
    };
    let rows: SubRow[] = [];
    try {
      rows = await sql.query<SubRow>(
        "select endpoint, p256dh, auth, tarlo, hydro from push_subs",
      );
    } catch {
      rows = await sql.query<SubRow>("select endpoint, p256dh, auth from push_subs");
    }
    for (const r of rows) {
      subs.set(r.endpoint, {
        endpoint: r.endpoint,
        keys:
          r.p256dh && r.auth ? { p256dh: r.p256dh, auth: r.auth } : undefined,
        tarlo: r.tarlo !== false,
        hydro: Boolean(r.hydro),
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
      `insert into push_subs (endpoint, p256dh, auth, tarlo, hydro, updated_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (endpoint) do update
         set p256dh = excluded.p256dh, auth = excluded.auth,
             tarlo = excluded.tarlo, hydro = excluded.hydro, updated_at = now()`,
      [
        s.endpoint,
        s.keys?.p256dh ?? null,
        s.keys?.auth ?? null,
        s.tarlo !== false,
        Boolean(s.hydro),
      ],
    );
  } catch {
    /* memory */
  }
}

async function sendAll(
  payload: { title: string; body: string; tag?: string },
  kind: "tarlo" | "hydro" | "all" = "all",
) {
  await loadSubs();
  const webpush = await webPush();
  const json = JSON.stringify(payload);
  const list = [...subs.values()].filter((s) => {
    if (kind === "tarlo") return s.tarlo !== false;
    if (kind === "hydro") return Boolean(s.hydro);
    return true;
  });
  await Promise.all(
    list.map(async (s) => {
      try {
        await webpush.sendNotification(s, json);
      } catch {
        subs.delete(s.endpoint);
      }
    }),
  );
}

async function hydroTick() {
  const rows = await fetchHydroSnapshot();
  if (!rows.length) return false;
  let sql: Awaited<ReturnType<typeof getSql>> | null = null;
  try {
    sql = await getSql();
  } catch {
    sql = null;
  }
  const alerts: string[] = [];
  for (const r of rows) {
    let prev: number | null = null;
    if (sql) {
      try {
        const hit = await sql.query<{ cm: number }>(
          "select cm from hydro_snap where kod = $1",
          [r.kod],
        );
        prev = hit[0]?.cm ?? null;
        await sql.query(
          `insert into hydro_snap (kod, cm, at) values ($1, $2, now())
           on conflict (kod) do update set cm = excluded.cm, at = now()`,
          [r.kod, r.cm],
        );
      } catch {
        /* no table yet */
      }
    }
    if (prev != null && Math.abs(r.cm - prev) >= 30) {
      const d = r.cm - prev;
      const sign = d > 0 ? "+" : "";
      alerts.push(`${r.rzeka} ${r.stacja}: ${r.cm} cm (${sign}${d} cm)`);
    }
  }
  if (!alerts.length) return false;
  await sendAll(
    {
      title: "Atlas wędkarski — stany IMGW",
      body: alerts.slice(0, 4).join(". "),
      tag: "atlas-hydro",
    },
    "hydro",
  );
  return true;
}

async function tick() {
  const due = tarloBody();
  if (due) await sendAll(due, "tarlo");
  const hydro = await hydroTick();
  return Boolean(due) || hydro;
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
        let body: { sub?: Sub; tick?: boolean; tarlo?: boolean; hydro?: boolean } = {};
        try {
          body = (await request.json()) as {
            sub?: Sub;
            tick?: boolean;
            tarlo?: boolean;
            hydro?: boolean;
          };
        } catch {
          body = {};
        }
        if (body.sub?.endpoint) {
          await saveSub({
            ...body.sub,
            tarlo: body.tarlo ?? body.sub.tarlo,
            hydro: body.hydro ?? body.sub.hydro,
          });
          const due = tarloBody();
          if (due) void sendAll(due, "tarlo");
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
