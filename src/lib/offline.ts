import { tileList, TILE_CACHE } from "@/lib/tiles";

export const DATA_CACHE = "atlas-data-v1";

function catalogBase() {
  const base = import.meta.env.BASE_URL || "/";
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}atlas/waters/`;
}

export async function registerAtlasSw() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/atlas-sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

async function catalogUrls() {
  const base = catalogBase();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const idxUrl = `${origin}${base}index.json`;
  const res = await fetch(idxUrl, { cache: "reload" });
  if (!res.ok) throw new Error("Brak indeksu katalogu");
  const idx = (await res.json()) as { shards?: string[] };
  const shards = idx.shards ?? [];
  return [idxUrl, ...shards.map((s) => `${origin}${base}${s}`)];
}

export async function downloadOffline(onProgress: (done: number, total: number) => void) {
  if (!("caches" in window)) throw new Error("Cache API niedostępne");
  await registerAtlasSw();
  const tiles = tileList(8, 11);
  let data: string[] = [];
  try {
    data = await catalogUrls();
  } catch {
    data = [];
  }
  const tileCache = await caches.open(TILE_CACHE);
  const dataCache = await caches.open(DATA_CACHE);
  const jobs: { url: string; cache: Cache }[] = [
    ...data.map((url) => ({ url, cache: dataCache })),
    ...tiles.map((url) => ({ url, cache: tileCache })),
  ];
  let done = 0;
  const batch = 8;
  for (let i = 0; i < jobs.length; i += batch) {
    const slice = jobs.slice(i, i + batch);
    await Promise.all(
      slice.map(async ({ url, cache }) => {
        try {
          const hit = await cache.match(url);
          if (hit) return;
          const res = await fetch(url, { mode: "cors", cache: "reload" });
          if (res.ok) await cache.put(url, res);
        } catch {
          /* skip */
        } finally {
          done += 1;
        }
      }),
    );
    onProgress(done, jobs.length);
  }
  return jobs.length;
}

export async function clearOffline() {
  if (!("caches" in window)) return;
  await caches.delete(TILE_CACHE);
  await caches.delete(DATA_CACHE);
}

export async function offlineCount() {
  if (!("caches" in window)) return 0;
  const [tiles, data] = await Promise.all([
    caches.open(TILE_CACHE).then((c) => c.keys()),
    caches.open(DATA_CACHE).then((c) => c.keys()),
  ]);
  return tiles.length + data.length;
}
