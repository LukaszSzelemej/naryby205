import type { JournalEntry } from "@/lib/types";

const FAV = "atlas.fav";
const JOURNAL = "atlas.journal";
const CONSENT = "atlas.consent";
const GEO = "atlas.geo";
const MAP_DARK = "atlas.mapDark";
const PAPERS = "atlas.papers";
const LAST_PACK = "atlas.lastPack";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadLastPack(): string | null {
  try {
    const id = localStorage.getItem(LAST_PACK);
    if (id && /^[a-z][a-z0-9-]*$/.test(id)) return id;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveLastPack(id: string) {
  try {
    localStorage.setItem(LAST_PACK, id);
  } catch {
    /* ignore */
  }
}

function packIdOf(pack?: string | null) {
  return pack || loadLastPack() || "zp";
}

function scoped(base: string, pack?: string | null) {
  return `${base}.${packIdOf(pack)}`;
}

/** Old unscoped keys belonged to Zachodniopomorskie. Copy once into `.zp`. */
function migrateLegacy(base: string) {
  try {
    if (localStorage.getItem(`${base}.zp`)) return;
    const old = localStorage.getItem(base);
    if (old) localStorage.setItem(`${base}.zp`, old);
  } catch {
    /* ignore */
  }
}

export function loadFavorites(pack?: string | null): string[] {
  migrateLegacy(FAV);
  return readJson<string[]>(scoped(FAV, pack), []);
}

export function saveFavorites(ids: string[], pack?: string | null) {
  try {
    localStorage.setItem(scoped(FAV, pack), JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function loadJournal(pack?: string | null): JournalEntry[] {
  migrateLegacy(JOURNAL);
  return readJson<JournalEntry[]>(scoped(JOURNAL, pack), []);
}

export function saveJournal(rows: JournalEntry[], pack?: string | null) {
  try {
    localStorage.setItem(scoped(JOURNAL, pack), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export type ConsentState = {
  cookies: boolean;
  geo: boolean;
  at: string;
} | null;

export function loadConsent(): ConsentState {
  return readJson<ConsentState>(CONSENT, null);
}

export function saveConsent(c: ConsentState) {
  if (!c) localStorage.removeItem(CONSENT);
  else localStorage.setItem(CONSENT, JSON.stringify(c));
}

export function saveLastGeo(lat: number, lng: number) {
  sessionStorage.setItem(GEO, JSON.stringify({ lat, lng }));
}

export function loadLastGeo(): { lat: number; lng: number } | null {
  try {
    const raw = sessionStorage.getItem(GEO);
    if (!raw) return null;
    const v = JSON.parse(raw) as { lat: number; lng: number };
    if (typeof v.lat === "number" && typeof v.lng === "number") return v;
    return null;
  } catch {
    return null;
  }
}

export function loadMapDark(): boolean {
  try {
    return localStorage.getItem(MAP_DARK) === "1";
  } catch {
    return false;
  }
}

export function saveMapDark(on: boolean) {
  try {
    if (on) localStorage.setItem(MAP_DARK, "1");
    else localStorage.removeItem(MAP_DARK);
  } catch {
    /* ignore */
  }
}

function parsePapers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is string =>
      typeof x === "string" &&
      x.length > 3 &&
      x.length < 80 &&
      (x.startsWith("pzw:") || x.startsWith("kind:") || x.startsWith("web:")) &&
      Boolean(x.split(":")[1]),
  );
}

export function loadPapers(pack?: string | null): string[] {
  migrateLegacy(PAPERS);
  return parsePapers(readJson<unknown>(scoped(PAPERS, pack), []));
}

export function savePapers(keys: string[], pack?: string | null) {
  try {
    localStorage.setItem(scoped(PAPERS, pack), JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}
