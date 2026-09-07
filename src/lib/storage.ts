import type { JournalEntry } from "@/lib/types";

const FAV = "atlas.fav";
const JOURNAL = "atlas.journal";
const CONSENT = "atlas.consent";
const GEO = "atlas.geo";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadFavorites(): string[] {
  return readJson<string[]>(FAV, []);
}

export function saveFavorites(ids: string[]) {
  localStorage.setItem(FAV, JSON.stringify(ids));
}

export function loadJournal(): JournalEntry[] {
  return readJson<JournalEntry[]>(JOURNAL, []);
}

export function saveJournal(rows: JournalEntry[]) {
  localStorage.setItem(JOURNAL, JSON.stringify(rows));
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
