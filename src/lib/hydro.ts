import { ACTIVE_PACK, foldPl } from "@/lib/catalog";
import type { Water } from "@/lib/types";

export type HydroRow = {
  rzeka: string;
  stacja: string;
  cm: number | null;
  at: string | null;
  delta?: number | null;
};

const STATIONS: { key: string; kod: string; stacja: string; rzeka: string }[] = [
  { key: "odra", kod: "153140050", stacja: "Szczecin", rzeka: "Odra" },
  { key: "odra", kod: "153140030", stacja: "Gryfino", rzeka: "Odra" },
  { key: "odra", kod: "153140020", stacja: "Widuchowa", rzeka: "Odra" },
  { key: "odra-lb", kod: "152150130", stacja: "Cigacice", rzeka: "Odra" },
  { key: "odra-lb", kod: "151150150", stacja: "Nowa Sól", rzeka: "Odra" },
  { key: "odra-lb", kod: "152140130", stacja: "Połęcko", rzeka: "Odra" },
  { key: "odra-lb", kod: "152140050", stacja: "Słubice", rzeka: "Odra" },
  { key: "odra-lb", kod: "152140060", stacja: "Kostrzyn n. Odrą", rzeka: "Odra" },
  { key: "warta", kod: "152150040", stacja: "Gorzów Wielkopolski", rzeka: "Warta" },
  { key: "warta", kod: "152150110", stacja: "Skwierzyna", rzeka: "Warta" },
  { key: "warta", kod: "152140070", stacja: "Kostrzyn n. Odrą", rzeka: "Warta" },
  { key: "bobr", kod: "151150080", stacja: "Żagań", rzeka: "Bóbr" },
  { key: "bobr", kod: "151150040", stacja: "Nowogród Bobrzański", rzeka: "Bóbr" },
  { key: "bobr", kod: "152150020", stacja: "Stary Raduszec", rzeka: "Bóbr" },
  { key: "nysa", kod: "151140010", stacja: "Gubin", rzeka: "Nysa Łużycka" },
  { key: "notec", kod: "152150190", stacja: "Nowe Drezdenko", rzeka: "Noteć" },
  { key: "rega", kod: "154150010", stacja: "Trzebiatów", rzeka: "Rega" },
  { key: "rega", kod: "153150050", stacja: "Resko", rzeka: "Rega" },
  { key: "drawa", kod: "153150100", stacja: "Drawno", rzeka: "Drawa" },
  { key: "drawa", kod: "153160030", stacja: "Stare Drawsko", rzeka: "Drawa" },
  { key: "parseta", kod: "154150050", stacja: "Białogard", rzeka: "Parsęta" },
  { key: "parseta", kod: "154150040", stacja: "Bardy", rzeka: "Parsęta" },
  { key: "ina", kod: "153140090", stacja: "Goleniów", rzeka: "Ina" },
  { key: "ina", kod: "153150010", stacja: "Stargard", rzeka: "Ina" },
  { key: "plonia", kod: "153140100", stacja: "Żelewo", rzeka: "Płonia" },
  { key: "wieprza", kod: "154160150", stacja: "Darłowo", rzeka: "Wieprza" },
];

function lubuskieWater(w: Water) {
  return w.woj === "lb" || ACTIVE_PACK?.id === "lb" || (w.lat != null && w.lat < 52.45 && w.lng != null && w.lng < 16.4);
}

export function hydroRiverKey(w: Water): string | null {
  if (w.kind !== "rzeka" && w.kind !== "kanal") return null;
  const n = foldPl(`${w.name} ${w.aliases?.join(" ") ?? ""}`);
  if (n.includes("odra") || n.includes("regalica")) return lubuskieWater(w) ? "odra-lb" : "odra";
  if (n.includes("warta")) return "warta";
  if (n.includes("bobr")) return "bobr";
  if (n.includes("nysa")) return "nysa";
  if (n.includes("notec")) return "notec";
  if (n.includes("rega") && !n.includes("regalica")) return "rega";
  if (n.includes("drawa")) return "drawa";
  if (n.includes("parseta") || n.includes("parsety")) return "parseta";
  if (/(^| )ina( |$)/.test(n) || n.includes("dolina iny")) return "ina";
  if (n.includes("plonia")) return "plonia";
  if (n.includes("wieprza")) return "wieprza";
  return null;
}

type Raw = {
  id_stacji?: string;
  kod_stacji?: string;
  rzeka?: string;
  stacja?: string;
  stan_wody?: string | number | null;
  stan_wody_data_pomiaru?: string | null;
};

let cache: Promise<Map<string, HydroRow>> | null = null;

function loadAll() {
  if (cache) return cache;
  cache = fetch("https://danepubliczne.imgw.pl/api/data/hydro", {
    cache: "no-cache",
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("hydro"))))
    .then((rows: Raw[]) => {
      const map = new Map<string, HydroRow>();
      for (const row of rows) {
        const kod = String(row.id_stacji ?? row.kod_stacji ?? "");
        if (!kod) continue;
        const cm = row.stan_wody == null || row.stan_wody === "" ? null : Number(row.stan_wody);
        map.set(kod, {
          rzeka: row.rzeka ?? "",
          stacja: row.stacja ?? "",
          cm: Number.isFinite(cm as number) ? (cm as number) : null,
          at: row.stan_wody_data_pomiaru ?? null,
        });
      }
      return map;
    })
    .catch(() => {
      cache = null;
      return new Map<string, HydroRow>();
    });
  return cache;
}

export async function fetchHydro(w: Water): Promise<HydroRow[]> {
  const key = hydroRiverKey(w);
  if (!key) return [];
  const all = await loadAll();
  return STATIONS.filter((s) => s.key === key)
    .map((s) => {
      const hit = all.get(s.kod);
      return {
        rzeka: s.rzeka,
        stacja: s.stacja,
        cm: hit?.cm ?? null,
        at: hit?.at ?? null,
      };
    })
    .filter((r) => r.cm != null);
}

const HYDRO_PREV = "atlas.hydroPrev";

export function withHydroTrend(rows: HydroRow[]): HydroRow[] {
  let prev: Record<string, { cm: number; at: string | null }> = {};
  try {
    prev = JSON.parse(sessionStorage.getItem(HYDRO_PREV) || "{}") as typeof prev;
  } catch {
    prev = {};
  }
  const next = { ...prev };
  const out = rows.map((r) => {
    const old = prev[r.stacja];
    let delta: number | null = null;
    if (old && r.cm != null && old.at !== r.at) delta = r.cm - old.cm;
    if (r.cm != null) next[r.stacja] = { cm: r.cm, at: r.at };
    return { ...r, delta };
  });
  try {
    sessionStorage.setItem(HYDRO_PREV, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return out;
}

export async function fetchHydroSnapshot() {
  const all = await loadAll();
  return STATIONS.map((s) => {
    const hit = all.get(s.kod);
    return {
      kod: s.kod,
      stacja: s.stacja,
      rzeka: s.rzeka,
      cm: hit?.cm ?? null,
      at: hit?.at ?? null,
    };
  }).filter((r): r is { kod: string; stacja: string; rzeka: string; cm: number; at: string | null } => r.cm != null);
}
