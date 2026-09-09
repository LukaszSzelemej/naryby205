import { foldPl, sortName, WATERS } from "@/lib/catalog";
import type { Water } from "@/lib/types";

export type WaterStock = {
  year: number;
  again?: number;
  species: string[];
  source: string;
  sourceLabel: string;
  note?: string;
};

export type ManagerStock = {
  year: number;
  summary: string;
  url: string;
  label: string;
};

type StockSource = { url: string; label: string };
type StockRow = {
  name: string;
  species: string[];
  hint?: string;
  year: number;
  again?: number;
  source?: string;
};

type StockPack = {
  sources?: Record<string, StockSource>;
  managers?: Record<string, ManagerStock>;
  waters?: StockRow[];
};

let SOURCES: Record<string, StockSource> = {};
let MANAGER_STOCKING: Record<string, ManagerStock> = {};
let ROWS: StockRow[] = [];
let INDEX: Map<string, StockRow[]> | null = null;

export function loadStockingPack(raw: unknown) {
  const data = (raw ?? {}) as StockPack;
  SOURCES = { ...(data.sources ?? {}) };
  MANAGER_STOCKING = { ...(data.managers ?? {}) };
  ROWS = [...(data.waters ?? [])];
  INDEX = null;
}

export function resetStockingPack() {
  SOURCES = {};
  MANAGER_STOCKING = {};
  ROWS = [];
  INDEX = null;
}

function keyOf(s: string) {
  return foldPl(
    sortName(s)
      .replace(/\s*\(.*\)\s*/g, " ")
      .replace(/\s*[–—-]\s*zbiornik.*$/i, "")
      .trim(),
  );
}

function matches(w: Water, row: StockRow) {
  const want = keyOf(row.name);
  if (want.length < 4) return false;
  const names = [w.name, ...(w.aliases ?? [])].map(keyOf);
  if (!names.includes(want)) return false;
  if (row.hint) {
    const hay = foldPl([w.name, w.gmina ?? "", w.powiat ?? "", ...(w.aliases ?? [])].join(" "));
    if (!hay.includes(foldPl(row.hint))) return false;
  }
  return true;
}

function rowsFor(w: Water): StockRow[] {
  if (!WATERS.length) return [];
  if (!INDEX) {
    const next = new Map<string, StockRow[]>();
    for (const r of ROWS) {
      const cand = WATERS.filter((x) => matches(x, r));
      const assign = cand.length === 1 ? cand : cand.length > 1 && cand.every((x) => x.kind === "rzeka") ? cand : [];
      for (const w of assign) {
        const id = w.id;
        const arr = next.get(id);
        if (arr) arr.push(r);
        else next.set(id, [r]);
      }
    }
    INDEX = next;
  }
  return INDEX.get(w.id) ?? [];
}

function pickSource(row: StockRow, year: number, again?: number): StockSource {
  if (row.source && SOURCES[row.source]) return SOURCES[row.source];
  const values = Object.values(SOURCES);
  if (again) {
    const tagged = values.find((s) => s.label.includes(String(again)));
    if (tagged) return tagged;
  }
  if (year && values.length) {
    const tagged = values.find((s) => s.label.includes(String(year)));
    if (tagged) return tagged;
  }
  return values[0] ?? { url: "", label: "Źródło" };
}

export function stockingOfWater(w: Water): WaterStock | null {
  const hits = rowsFor(w);
  if (!hits.length) return null;
  const species = [...new Set(hits.flatMap((r) => r.species))];
  const year = Math.max(...hits.map((r) => r.year));
  const again = hits.find((r) => r.again)?.again;
  const top = hits.find((r) => r.year === year && r.source) ?? hits.find((r) => r.year === year) ?? hits[0];
  const src = pickSource(top, year, again);
  const jesiotr = hits.some((r) => r.source === "jesiotr");
  return {
    year,
    again,
    species,
    source: src.url,
    sourceLabel: src.label,
    note: again
      ? `Tabela ilości: ${year}. Okręg wymienia to łowisko też w ${again}.`
      : jesiotr
        ? "Zarybienie węgorzem (koło Jesiotr / okręg Koszalin). 2025: węgorz na jeziora okręgu — bez pełnej tabeli po wodach."
        : undefined,
  };
}

export function stockingOfManager(id: string | undefined | null) {
  if (!id) return null;
  return MANAGER_STOCKING[id] ?? null;
}
