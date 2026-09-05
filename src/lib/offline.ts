import { tileList, TILE_CACHE } from "@/lib/tiles";

export async function downloadOffline(
  onProgress: (done: number, total: number) => void,
) {
  if (!("caches" in window)) throw new Error("Cache API niedostępne");
  const cache = await caches.open(TILE_CACHE);
  const urls = tileList(8, 11);
  let done = 0;
  const batch = 8;
  for (let i = 0; i < urls.length; i += batch) {
    const slice = urls.slice(i, i + batch);
    await Promise.all(
      slice.map(async (u) => {
        try {
          const hit = await cache.match(u);
          if (hit) return;
          const res = await fetch(u, { mode: "cors" });
          if (res.ok) await cache.put(u, res);
        } catch {
          /* skip tile */
        } finally {
          done += 1;
        }
      }),
    );
    onProgress(done, urls.length);
  }
  return urls.length;
}

export async function clearOffline() {
  if ("caches" in window) await caches.delete(TILE_CACHE);
}

export async function offlineCount() {
  if (!("caches" in window)) return 0;
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  return keys.length;
}
