import speciesJson from "@/data/species.json";
import managersJson from "@/data/managers.json";
import type {
  HostKind,
  MapFilter,
  Manager,
  Species,
  Water,
  WaterKind,
} from "@/lib/types";

export { CUPLINK, INSTAGRAM, SITE_URL, VERSION } from "@/lib/brand";

/** Filled by loadCatalog() during splash — never import the 644KB JSON into the bundle. */
export const WATERS: Water[] = [];
export const WATERS_BY_ID: Record<string, Water> = {};
const NAME_COUNTS: Record<string, number> = {};
export const SPECIES = speciesJson as Species[];
export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
);

type ManagersFile = {
  managers: Record<string, Manager>;
  okragToManager: Record<string, string>;
  hostById: Record<string, string>;
};

const MANAGERS_FILE = managersJson as ManagersFile;
export const MANAGERS = MANAGERS_FILE.managers;
export const OKRAG_TO_MANAGER = MANAGERS_FILE.okragToManager;
const HOST_BY_ID = MANAGERS_FILE.hostById;

const MANAGER_KIND_KEY: Record<string, string> = {
  girm: "girm",
  "rzgw-szczecin": "wir",
  modehpolmo: "modehpolmo",
  "gr-czaplinek": "gr-czaplinek",
  "gr-insko": "gr-insko",
  "pr-zlocieniec": "pr-zlocieniec",
  "pr-szczecinek": "pr-szczecinek",
  "jis-walcz": "jis-walcz",
  "ntw-bialy-bor": "ntw",
  "mtw-mysliborz": "mtw",
};

const hostKindCache = new Map<string, HostKind>();

export const BOUNDS = { south: 52.62, west: 14.12, north: 54.58, east: 16.98 };
export const MAP_CENTER: [number, number] = [53.52, 15.35];
export const DEFAULT_ZOOM = 8;

export const DISCLAIMER =
  "Atlas wędkarski ma charakter poglądowy. Przed wyjazdem zawsze sprawdź pozwolenia, regulaminy i zasady u gospodarza wody.";

export const KIND_LABEL: Record<WaterKind, string> = {
  jezioro: "Jezioro",
  rzeka: "Rzeka",
  zalew: "Zalew",
  morze: "Morze",
  kanal: "Kanał",
  staw: "Staw",
  komercyjne: "Komercyjne",
};

export const METHOD_LABEL: Record<string, string> = {
  spławik: "Spławik",
  grunt: "Grunt",
  spinning: "Spinning",
  "method feeder": "Method feeder",
  mucha: "Mucha",
  trolling: "Trolling",
  podlodowe: "Pod lód",
};

export function methodFromWater(w?: Water | null) {
  const ms = w?.methods ?? [];
  const hit = ms.find((m) => METHOD_LABEL[m]);
  return hit ?? "spinning";
}

export const KIND_COLOR: Record<WaterKind, string> = {
  jezioro: "#1b6e66",
  rzeka: "#2c6280",
  zalew: "#3a6a7c",
  morze: "#1a4d6e",
  kanal: "#2f646c",
  staw: "#3f6b45",
  komercyjne: "#8a6418",
};

export const FILTER_META: Record<
  MapFilter,
  { label: string; color: string }
> = {
  location: { label: "Lokalizacja", color: "#3d5570" },
  all: { label: "Wszystkie", color: "#2f6b4a" },
  specjalne: { label: "Specjalne", color: "#8a3e3a" },
  pzw: { label: "PZW", color: "#1e5c36" },
  jezioro: { label: "Jeziora", color: "#1b6e66" },
  prywatne: { label: "Prywatne", color: "#9a4a22" },
  zalew: { label: "Zalewy", color: "#3a6a7c" },
  staw: { label: "Stawy", color: "#3f6b45" },
  rzeka: { label: "Rzeki", color: "#2c6280" },
  kanal: { label: "Kanały", color: "#2f646c" },
  morze: { label: "Morze", color: "#1a4d6e" },
  komercyjne: { label: "Komercyjne", color: "#8a6418" },
  ulubione: { label: "Ulubione", color: "#8a6a28" },
};

export const LIST_CATEGORIES: { id: MapFilter; label: string; color: string }[] =
  (
    [
      "all",
      "pzw",
      "specjalne",
      "jezioro",
      "staw",
      "prywatne",
      "zalew",
      "rzeka",
      "kanal",
      "morze",
      "komercyjne",
      "ulubione",
    ] as MapFilter[]
  ).map((id) => ({
    id,
    label: FILTER_META[id].label,
    color: FILTER_META[id].color,
  }));

export const ALPHABET: string[][] = [
  ["A", "Ą", "B", "C", "Ć", "D", "E", "Ę", "F", "G"],
  ["H", "I", "J", "K", "L", "Ł", "M", "N", "Ń", "O"],
  ["Ó", "P", "Q", "R", "S", "Ś", "T", "U", "V", "W"],
  ["X", "Y", "Z", "Ź", "Ż"],
];

const PREFIX = /^(jezioro|rzeka|stawy|staw|łowisko|zalew|zbiornik|kanały|kanał)\s+/i;

export function sortName(name: string) {
  return name.replace(PREFIX, "").replace(/^bałtyk\s*[—–-]\s*/i, "").trim();
}

export function letterOf(name: string) {
  return sortName(name).charAt(0).toLocaleUpperCase("pl") || "#";
}

export const SPECIES_LETTERS = new Set(SPECIES.map((s) => letterOf(s.name)));

export function foldPl(s: string) {
  return s
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

function joinedText(w: Water) {
  return [w.summary, w.ticket, ...(w.rules ?? [])].filter(Boolean).join(" ");
}

export function hostKindOf(w: Water): HostKind {
  const hit = hostKindCache.get(w.id);
  if (hit) return hit;
  const k = hostKindUncached(w);
  hostKindCache.set(w.id, k);
  return k;
}

function hostKindUncached(w: Water): HostKind {
  const t = joinedText(w);
  if (w.kind === "morze" || w.okrag === "morskie" || w.tenure === "girm") {
    return "girm";
  }
  if (
    w.tenure === "wody-polskie" ||
    /\bWIR\b|wody polskie|RZGW Szczecin/i.test(t)
  ) {
    return "wir";
  }
  const mapped = w.id ? HOST_BY_ID[w.id] : undefined;
  if (mapped === "modehpolmo") return "modehpolmo";
  if (mapped === "gr-insko") return "gr-insko";
  if (mapped === "gr-czaplinek") return "gr-czaplinek";
  if (mapped === "pr-zlocieniec") return "pr-zlocieniec";
  if (mapped === "pr-szczecinek") return "pr-szczecinek";
  if (mapped === "jis-walcz") return "jis-walcz";
  if (mapped === "ntw") return "ntw";
  if (mapped === "mtw") return "mtw";
  if (mapped === "pzw-special") return "pzw-special";
  if (/modehpolmo/i.test(t)) return "modehpolmo";
  if (/ntw biały/i.test(t)) return "ntw";
  if (/mtw myślibórz|myśliborskiego towarzystwa/i.test(t)) return "mtw";
  if (/gospodarstwa rybackiego ińsko|\bgr ińsko\b|\bICR\b/i.test(t)) {
    return "gr-insko";
  }
  if (/przedsiębiorstw[ao] rybackie(?:go)? złocieniec|\bpr złocieniec\b/i.test(t)) {
    return "pr-zlocieniec";
  }
  if (/gospodarstwo rybackie w czaplinku|\bgr czaplinek\b/i.test(t)) {
    return "gr-czaplinek";
  }
  if (/przedsiębiorstw[ao] rybackie(?:go)? szczecinek|\bpr szczecinek\b/i.test(t)) {
    return "pr-szczecinek";
  }
  if (/jeziora i stawy wałeckie|\bjis wałeckie\b/i.test(t)) return "jis-walcz";
  if (w.id === "bielinek") return "pzw-special";
  if (
    w.kind === "komercyjne" ||
    w.tenure === "prywatne" ||
    w.tenure === "specjalne" ||
    (/karnet gospodarza/i.test(t) && !/PZW/i.test(t)) ||
    (w.ticket &&
      /karnet|gospodarz|hodowl/i.test(w.ticket) &&
      !/PZW/i.test(w.ticket))
  ) {
    return "private";
  }
  return "pzw";
}

function catalogBase() {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.endsWith("/") ? base : `${base}/`}atlas/waters/`;
}

let catalogLoading: Promise<void> | null = null;

function fillWaters(rows: Water[]) {
  if (WATERS.length) return;
  for (const w of rows) {
    if (w.species?.length) w.species = [...new Set(w.species)];
    w.obwod = normObwodList([...(w.obwod ?? []), ...parseObwod(w)]);
    w.night = Boolean(w.night) || inferNight(w);
  }
  WATERS.push(...rows);
  for (const w of rows) WATERS_BY_ID[w.id] = w;
  for (const k of Object.keys(NAME_COUNTS)) delete NAME_COUNTS[k];
  for (const w of rows) NAME_COUNTS[w.name] = (NAME_COUNTS[w.name] ?? 0) + 1;
  void import("@/lib/store").then(({ useAtlas }) => {
    useAtlas.setState({
      catalogReady: true,
      catalogError: null,
    });
  });
}

type CatalogIndex = { n: number; shards: string[] };

async function fetchJson<T>(url: string, ms = 6000): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { cache: "force-cache", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.charCodeAt(0) === 0x3c) {
      throw new Error("Katalog nie jest JSON-em");
    }
    return JSON.parse(text) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor;
      cursor += 1;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

/** Load fishing catalog from small alphabetical JSON shards. Safe to call twice. */
export function loadCatalog() {
  if (typeof window === "undefined") return Promise.resolve();
  if (WATERS.length) return Promise.resolve();
  if (catalogLoading) return catalogLoading;
  catalogLoading = (async () => {
    const base = catalogBase();
    const idx = await fetchJson<CatalogIndex>(`${base}index.json`, 5000);
    if (!idx?.shards?.length) throw new Error("Pusty katalog łowisk");
    const parts = await mapPool(idx.shards, 12, (name) =>
      fetchJson<Water[]>(`${base}${name}`, 6000),
    );
    const rows = parts.flat();
    if (rows.length < 10) throw new Error("Pusty katalog łowisk");
    fillWaters(rows);
  })().catch((err) => {
    catalogLoading = null;
    console.warn("catalog", err);
    void import("@/lib/store").then(({ useAtlas }) => {
      useAtlas.setState({ catalogError: "Nie udało się wczytać katalogu." });
    });
  });
  return catalogLoading;
}

export function retryCatalog() {
  catalogLoading = null;
  WATERS.length = 0;
  for (const k of Object.keys(WATERS_BY_ID)) delete WATERS_BY_ID[k];
  for (const k of Object.keys(NAME_COUNTS)) delete NAME_COUNTS[k];
  hostKindCache.clear();
  void import("@/lib/store").then(({ useAtlas }) => {
    useAtlas.setState({ catalogError: null, catalogReady: false });
  });
  return loadCatalog();
}

export function managerOf(w: Water): Manager {
  const k = hostKindOf(w);
  if (k === "girm") return MANAGERS.girm;
  if (k === "wir") return MANAGERS["rzgw-szczecin"];
  if (k === "modehpolmo") return MANAGERS.modehpolmo;
  if (k === "gr-czaplinek") return MANAGERS["gr-czaplinek"];
  if (k === "gr-insko") return MANAGERS["gr-insko"];
  if (k === "pr-zlocieniec") return MANAGERS["pr-zlocieniec"];
  if (k === "pr-szczecinek") return MANAGERS["pr-szczecinek"];
  if (k === "jis-walcz") return MANAGERS["jis-walcz"];
  if (k === "ntw") return MANAGERS["ntw-bialy-bor"];
  if (k === "mtw") return MANAGERS["mtw-mysliborz"];
  if (k === "pzw-special") return MANAGERS["pzw-szczecin"];
  if (k === "private") {
    return {
      id: "gospodarz",
      name: "Gospodarz łowiska",
      shortName: "Prywatne",
      permitLabel: "Karnet gospodarza",
      website: w.website ?? undefined,
      socialUrl: w.socialUrl ?? undefined,
      priceNote:
        w.ticket ?? "Karnet u gospodarza, na miejscu albo przez stronę.",
    };
  }
  const id = OKRAG_TO_MANAGER[w.okrag ?? ""] ?? "pzw-szczecin";
  return MANAGERS[id] ?? MANAGERS["pzw-szczecin"];
}

function isPrivate(w: Water) {
  const k = hostKindOf(w);
  return (
    k === "private" ||
    k === "ntw" ||
    k === "mtw" ||
    k === "modehpolmo" ||
    k === "gr-czaplinek" ||
    k === "gr-insko" ||
    k === "pr-zlocieniec" ||
    k === "pr-szczecinek" ||
    k === "jis-walcz" ||
    w.kind === "komercyjne"
  );
}

export function isSpecial(w: Water) {
  return hostKindOf(w) !== "pzw";
}

function isPzw(w: Water) {
  return hostKindOf(w) === "pzw";
}

export function categoryTags(w: Water): string[] {
  const tags = [KIND_LABEL[w.kind] ?? w.kind];
  const n = hostKindOf(w);
  if (n === "private") tags.push("Prywatne");
  else if (n === "pzw-special" || w.id === "bielinek") tags.push("Specjalne");
  else if (n === "girm") tags.push("GIRM");
  else if (n === "wir") tags.push("Wody Polskie");
  else if (n === "modehpolmo") tags.push("Modehpolmo");
  else if (n === "ntw") tags.push("NTW Biały Bór");
  else if (n === "mtw") tags.push("MTW Myślibórz");
  else if (n === "gr-czaplinek") tags.push("GR Czaplinek");
  else if (n === "gr-insko") tags.push("GR Ińsko");
  else if (n === "pr-zlocieniec") tags.push("PR Złocieniec");
  else if (n === "pr-szczecinek") tags.push("PR Szczecinek");
  else if (n === "jis-walcz") tags.push("JiS Wałeckie");
  else if (n === "pzw") tags.push(`PZW ${w.okrag ?? ""}`.trim());
  return tags;
}

export function matchesFilter(w: Water, f: MapFilter, favIds?: Set<string>) {
  switch (f) {
    case "location":
    case "all":
      return true;
    case "specjalne":
      return isSpecial(w);
    case "pzw":
      return isPzw(w);
    case "prywatne":
      return isPrivate(w);
    case "komercyjne":
      return w.kind === "komercyjne";
    case "ulubione":
      return !!favIds?.has(w.id);
    case "jezioro":
    case "rzeka":
    case "zalew":
    case "staw":
    case "kanal":
    case "morze":
      return w.kind === f;
    default:
      return true;
  }
}

export function pinColor(w: Water, f: MapFilter) {
  if (f === "all" || f === "location") return KIND_COLOR[w.kind];
  return FILTER_META[f]?.color ?? KIND_COLOR[w.kind];
}

export function sanitizeQuery(raw: string) {
  let s = "";
  for (const ch of raw) {
    if (ch < " " || ch === "<" || ch === ">") continue;
    s += ch;
  }
  return s
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/on\w+=/gi, "")
    .slice(0, 80);
}

export function searchWaters(query: string, pool: Water[] = WATERS): Water[] {
  const n = foldPl(sanitizeQuery(query).trim());
  if (!n) return pool;
  if (n.length < 2 && !/^\d+$/.test(n)) return [];
  const strip = (s: string) =>
    s.replace(/^(jezioro|rzeka|kanal|staw|zalew|lowisko)\s+/i, "");
  return pool
    .map((w) => {
      const names = [w.name, ...(w.aliases ?? [])].map((x) => foldPl(x));
      const gmina = foldPl(w.gmina ?? "");
      const okrag = foldPl(w.okrag ?? "");
      const powiat = foldPl(w.powiat ?? "");
      const hay = foldPl(
        [w.powiat, w.gmina ?? "", w.okrag, w.kind, ...(w.obwod ?? []), ...w.species].join(" "),
      );
      let score = 0;
      if (names.some((x) => x === n)) score = 100;
      else if (names.some((x) => strip(x) === n)) score = 90;
      else if (
        names.some((x) => x.startsWith(n) || strip(x).startsWith(n))
      )
        score = 80;
      else if (gmina === n || okrag === n || powiat === n) score = 70;
      else if (names.some((x) => x.includes(n))) score = 60;
      else if (
        (gmina && gmina.includes(n)) ||
        (okrag && okrag.includes(n)) ||
        (powiat && powiat.includes(n))
      )
        score = 50;
      else if (hay.includes(n)) score = 20;
      if (matchesObwod(w, query) && /(?:^|\s)(?:j-?|r-?)?\d{1,3}$/i.test(n)) {
        score = Math.max(score, 88);
      }
      if (w.featured && score >= 60) score += 8;
      return { w, score };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.w.areaHa ?? 0) - (a.w.areaHa ?? 0) ||
        a.w.name.localeCompare(b.w.name, "pl"),
    )
    .map((x) => x.w);
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistance(km: number | null | undefined) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 0.95) return `${Math.max(50, Math.round(km * 20) * 50)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

export function inferNight(w: Water): boolean {
  const blob = foldPl([...(w.rules ?? []), w.ticket ?? "", w.summary ?? ""].join(" "));
  if (/zakaz.{0,28}noc|bez nocy|nie wolno.{0,18}noc/.test(blob)) return false;
  if (/\bnoc(y|a|nego|leg)?\b/.test(blob)) return true;
  return false;
}

export function formatSize(w: Water) {
  if (w.kind === "rzeka" || w.kind === "kanal") {
    return w.lengthKm ? `${w.lengthKm} km` : null;
  }
  if (!w.areaHa) return null;
  if (w.areaHa >= 1000) return `${(w.areaHa / 100).toFixed(0)} km²`;
  if (w.areaHa >= 10) return `${w.areaHa.toLocaleString("pl-PL")} ha`;
  return `${String(w.areaHa).replace(".", ",")} ha`;
}

export function formatDepth(w: Water) {
  if (!w.maxDepthM) return null;
  const max = String(w.maxDepthM).replace(".", ",");
  if (w.avgDepthM) return `max ${max} m · śr. ${String(w.avgDepthM).replace(".", ",")} m`;
  return `${max} m`;
}

export function speciesName(id: string) {
  return SPECIES_BY_ID[id]?.name ?? id;
}

export function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function googleNav(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function googlePin(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

const DEAD_HOSTS = new Set([
  "gruba-rybka.pl",
  "karas2015.pl",
  "dolinainy.pl",
]);

export function safeHttpUrl(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (DEAD_HOSTS.has(host)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function linkKind(url: string): "facebook" | "instagram" | "youtube" | "tiktok" | "web" {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (h === "facebook.com" || h === "fb.com" || h === "m.facebook.com" || h.endsWith(".facebook.com")) {
      return "facebook";
    }
    if (h === "instagram.com" || h.endsWith(".instagram.com")) return "instagram";
    if (h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com")) return "youtube";
    if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  } catch {
    /* ignore */
  }
  return "web";
}

export function linkLabel(url: string, role: "host" | "social" = "host") {
  const kind = linkKind(url);
  if (kind === "facebook") return "Facebook";
  if (kind === "instagram") return "Instagram";
  if (kind === "youtube") return "YouTube";
  if (kind === "tiktok") return "TikTok";
  return role === "social" ? "Społeczność" : "Strona gospodarza";
}

export function watersForSpecies(speciesId: string) {
  return WATERS.filter((w) => w.species.includes(speciesId)).sort((a, b) =>
    sortName(a.name).localeCompare(sortName(b.name), "pl"),
  );
}

function hostNameFromUrl(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export function hostGroupOf(w: Water): { key: string; label: string } {
  const k = hostKindOf(w);
  const mgr = managerOf(w);
  if (k === "private") {
    const host = hostNameFromUrl(w.website) || hostNameFromUrl(w.socialUrl);
    if (host) {
      const label = mgr.name === "Gospodarz łowiska" ? host : mgr.name;
      return { key: `web:${host}`, label };
    }
    return { key: `one:${w.id}`, label: w.name };
  }
  if (k === "pzw" || k === "pzw-special") {
    return { key: `pzw:${mgr.id}`, label: mgr.name };
  }
  return { key: `kind:${k}`, label: mgr.name };
}

export function hostKeyOfManager(id: string) {
  if (id.startsWith("pzw-")) return `pzw:${id}`;
  const k = MANAGER_KIND_KEY[id];
  return k ? `kind:${k}` : `pzw:${id}`;
}

export function labelOfHostKey(key: string) {
  return managerFromHostKey(key)?.name ?? (key.startsWith("web:") ? key.slice(4) : "Gospodarz");
}

export function managerFromHostKey(key: string) {
  if (key.startsWith("pzw:")) return MANAGERS[key.slice(4)] ?? null;
  if (key.startsWith("kind:")) {
    const k = key.slice(5);
    const id = Object.keys(MANAGER_KIND_KEY).find((m) => MANAGER_KIND_KEY[m] === k);
    return id ? (MANAGERS[id] ?? null) : null;
  }
  return null;
}

export function watersOfHost(key: string) {
  return WATERS.filter((w) => hostGroupOf(w).key === key).sort((a, b) =>
    sortName(a.name).localeCompare(sortName(b.name), "pl"),
  );
}

function parseObwod(w: Water): string[] {
  const blob = [...(w.rules ?? []), w.ticket ?? "", w.summary ?? ""].join(" ");
  const out = new Set<string>();
  const addNum = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0 && n < 1000) out.add(String(n).padStart(3, "0"));
  };
  for (const m of blob.matchAll(/PZW[^0-9]{0,28}nr\.?\s*(\d{1,3})(?:\s*i\s*(\d{1,3}))?/gi)) {
    addNum(m[1]);
    if (m[2]) addNum(m[2]);
  }
  for (const m of blob.matchAll(/ko[lł][eao][^0-9]{0,18}nr\.?\s*(\d{1,3})/gi)) {
    addNum(m[1]);
  }
  for (const m of blob.matchAll(/\b([JR])-(\d{1,3})\b/g)) {
    out.add(`${m[1].toUpperCase()}-${Number(m[2])}`);
  }
  for (const m of blob.matchAll(/obw[oó]d(?:zie)?\s*(?:nr\.?\s*)?(\d{1,3})/gi)) {
    addNum(m[1]);
  }
  return [...out];
}

export function classifyObwod(o: string): "kolo" | "jezioro" | "rzeka" {
  if (/^J-/i.test(o)) return "jezioro";
  if (/^R-/i.test(o)) return "rzeka";
  return "kolo";
}

export function obwodLabel(o: string) {
  if (/^J-/i.test(o)) return `J-${Number(o.slice(2))}`;
  if (/^R-/i.test(o)) return `R-${Number(o.slice(2))}`;
  const n = Number(String(o).replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? `Koło ${n}` : o;
}

function normObwodList(list: string[]) {
  const set = new Set<string>();
  for (const o of list) {
    if (/^J-/i.test(o)) {
      const n = Number(o.replace(/\D/g, ""));
      if (n > 0) set.add(`J-${n}`);
    } else if (/^R-/i.test(o)) {
      const n = Number(o.replace(/\D/g, ""));
      if (n > 0) set.add(`R-${n}`);
    } else {
      const n = Number(String(o).replace(/\D/g, ""));
      if (Number.isFinite(n) && n > 0 && n < 1000) set.add(String(n).padStart(3, "0"));
    }
  }
  return [...set];
}

function obwodDigits(o: string) {
  const d = String(o).replace(/\D/g, "");
  return d ? String(Number(d)) : "";
}

export function matchesObwod(w: { obwod?: string[] }, q: string) {
  const raw = foldPl(q.trim()).replace(/^kolo\s+/, "").replace(/^obwod\s+/, "").trim();
  if (!raw) return true;
  const list = w.obwod ?? [];
  if (!list.length) return false;
  const j = raw.match(/^j-?(\d{1,3})$/);
  const r = raw.match(/^r-?(\d{1,3})$/);
  const num = raw.match(/^(\d{1,3})$/);
  return list.some((o) => {
    const kind = classifyObwod(o);
    const dig = obwodDigits(o);
    if (j) return kind === "jezioro" && dig === String(Number(j[1]));
    if (r) return kind === "rzeka" && dig === String(Number(r[1]));
    if (num) return dig === String(Number(num[1]));
    return foldPl(o).includes(raw) || foldPl(obwodLabel(o)).includes(raw);
  });
}

export function nearestWaters(w: Water, n = 5): { w: Water; km: number }[] {
  return WATERS.filter((x) => x.id !== w.id)
    .map((x) => ({ w: x, km: haversineKm(w.lat, w.lng, x.lat, x.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

export function nearestTo(lat: number, lng: number, n = 5): Water[] {
  return [...WATERS]
    .map((w) => ({ w, km: haversineKm(lat, lng, w.lat, w.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n)
    .map((x) => x.w);
}

export function allObwody(pool: Water[] = WATERS) {
  const set = new Set<string>();
  for (const w of pool) for (const o of w.obwod ?? []) set.add(o);
  return [...set].sort((a, b) => a.localeCompare(b, "pl", { numeric: true }));
}

export function plWaters(n: number, here = false) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const noun =
    n === 1
      ? "łowisko"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "łowiska"
        : "łowisk";
  return here ? `${n} ${noun} tutaj` : `${n} ${noun}`;
}

function mdToNum(md: string) {
  const [m, d] = md.split("-").map(Number);
  return (m ?? 1) * 100 + (d ?? 1);
}

function isClosedNow(
  from: string,
  to: string,
  at: Date = new Date(),
) {
  const n = (at.getMonth() + 1) * 100 + at.getDate();
  const a = mdToNum(from);
  const b = mdToNum(to);
  return a <= b ? n >= a && n <= b : n >= a || n <= b;
}

function formatPeriod(from: string, to: string) {
  return `${from.replace("-", ".")} – ${to.replace("-", ".")}`;
}

export function waterTitle(w: Water) {
  if ((NAME_COUNTS[w.name] ?? 0) > 1 && w.gmina) return `${w.name} (${w.gmina})`;
  return w.name;
}

export function protectionOf(sp: Species, at: Date = new Date(), atSea = false) {
  if (sp.seaBan && !sp.closed.length) {
    if (!atSea) {
      return {
        hasPeriod: false,
        active: false,
        label: "Zakaz połowu tylko na morzu",
      };
    }
    return {
      hasPeriod: true,
      active: true,
      label: "Zakaz połowu na morzu",
    };
  }
  const inland = sp.closed.map((c) => ({ ...c, sea: false }));
  const marine = (sp.seaClosed ?? []).map((c) => ({ ...c, sea: true }));
  const all = [...inland, ...marine];
  if (!all.length) {
    return {
      hasPeriod: false,
      active: false,
      label: "Brak okresu ochronnego",
    };
  }
  const active = all.some((c) => isClosedNow(c.from, c.to, at));
  const label = `Okres ochronny: ${all
    .map(
      (c) =>
        formatPeriod(c.from, c.to) +
        (c.note ? ` (${c.note})` : c.sea ? " (morze)" : ""),
    )
    .join(", ")}`;
  return { hasPeriod: true, active, label };
}

const OKREG_FORK: Record<string, Record<string, { min: number; max?: number }>> = {
  Szczecin: {
    szczupak: { min: 50, max: 80 },
    sandacz: { min: 50, max: 80 },
    okon: { min: 18, max: 35 },
  },
  Koszalin: {
    szczupak: { min: 50, max: 80 },
    sandacz: { min: 50, max: 80 },
    okon: { min: 18, max: 35 },
  },
};

export function formatProtect(sp: Species, okrag?: string, sea = false) {
  const fork = okrag ? OKREG_FORK[okrag]?.[sp.id] : undefined;
  const min = fork?.min ?? sp.minCm;
  const max = fork?.max;
  const size =
    sp.dailyLimit === 0 && !min
      ? "zakaz zabierania"
      : min
        ? max
          ? `${min}–${max} cm`
          : `do ${min} cm`
        : "brak wymiaru";
  const limit =
    sp.dailyLimit === 0
      ? "zakaz zabierania"
      : sp.dailyLimit != null
        ? `${sp.dailyLimit} szt./doba`
        : "brak limitu sztuk";
  return { size, limit, period: protectionOf(sp, new Date(), sea), fork: Boolean(fork) };
}

export function closedEndingDays(sp: Species, at: Date = new Date()): number | null {
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

export const MAP_SPECIES = [
  "szczupak",
  "sandacz",
  "okon",
  "sum",
  "karp",
  "lin",
  "pstrag-potokowy",
  "troc",
  "wegorz",
  "bolen",
] as const;

export function protectHint(id: string, okrag?: string, sea = false) {
  const sp = SPECIES_BY_ID[id];
  if (!sp) return "";
  const p = formatProtect(sp, okrag, sea);
  const size =
    p.size === "brak wymiaru"
      ? "Brak wymiaru ochronnego"
      : p.size === "zakaz zabierania"
        ? "Zakaz zabierania"
        : `Wymiar ochronny: ${p.size}`;
  const extra = p.period.active
    ? " · ochrona trwa"
    : sp.seaBan
      ? ` · ${p.period.label}`
      : "";
  return `${size} · ${p.limit}${extra}`;
}
