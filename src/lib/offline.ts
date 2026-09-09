import { ACTIVE_PACK, atlasPackRoot } from "@/lib/catalog";
import { loadLastPack } from "@/lib/storage";
import { tileList, TILE_CACHE } from "@/lib/tiles";

export const DATA_CACHE = "atlas-data-v2";

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
  const root = atlasPackRoot();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const idxUrl = `${origin}${root}index.json`;
  const idx = (await (await fetch(idxUrl, { cache: "reload" })).json()) as {
    default?: string;
    packs?: { id: string }[];
  };
  const packId = ACTIVE_PACK?.id || loadLastPack() || idx.default || idx.packs?.[0]?.id;
  if (!packId) throw new Error("Brak pakietu województwa");
  const packDir = `${origin}${root}${packId}/`;
  const manifest = (await (await fetch(`${packDir}manifest.json`, { cache: "reload" })).json()) as {
    watersDir?: string;
    managers?: string;
    stocking?: string;
  };
  const watersBase = `${packDir}${manifest.watersDir || "waters"}/`;
  const watersIdx = (await (await fetch(`${watersBase}index.json`, { cache: "reload" })).json()) as {
    shards?: string[];
  };
  const urls = [
    idxUrl,
    `${packDir}manifest.json`,
    manifest.managers ? `${packDir}${manifest.managers}` : "",
    manifest.stocking ? `${packDir}${manifest.stocking}` : "",
    `${watersBase}index.json`,
    ...(watersIdx.shards ?? []).map((s) => `${watersBase}${s}`),
  ];
  return urls.filter(Boolean);
}

const PACK_KEY = "atlas.offlinePack";

function packInfoKey() {
  const id = ACTIVE_PACK?.id || loadLastPack() || "zp";
  return `${PACK_KEY}.${id}`;
}

export type PackInfo = { at: string; files: number };

export function loadPackInfo(): PackInfo | null {
  try {
    const raw = localStorage.getItem(packInfoKey()) || localStorage.getItem(PACK_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as PackInfo;
    if (typeof v.files === "number" && v.at) {
      if (ACTIVE_PACK?.id && !localStorage.getItem(packInfoKey()) && localStorage.getItem(PACK_KEY)) {
        if ((loadLastPack() || "zp") === "zp") return v;
        return null;
      }
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function emitPack() {
  try {
    window.dispatchEvent(new Event("atlas-offline-pack"));
  } catch {
    /* ignore */
  }
}

export function savePackInfo(files: number): PackInfo {
  const info: PackInfo = { at: new Date().toISOString(), files };
  try {
    localStorage.setItem(packInfoKey(), JSON.stringify(info));
  } catch {
    /* ignore */
  }
  emitPack();
  return info;
}

export function clearPackInfo() {
  try {
    localStorage.removeItem(packInfoKey());
    localStorage.removeItem(PACK_KEY);
  } catch {
    /* ignore */
  }
  emitPack();
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
  const n = await offlineCount();
  savePackInfo(n);
  return n;
}

export async function clearOffline() {
  if (!("caches" in window)) return;
  await caches.delete(TILE_CACHE);
  await caches.delete(DATA_CACHE);
  clearPackInfo();
}

export async function offlineCount() {
  if (!("caches" in window)) return 0;
  const [tiles, data] = await Promise.all([
    caches.open(TILE_CACHE).then((c) => c.keys()),
    caches.open(DATA_CACHE).then((c) => c.keys()),
  ]);
  return tiles.length + data.length;
}
