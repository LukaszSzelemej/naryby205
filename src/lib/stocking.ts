import { foldPl, sortName, SPECIES_BY_ID } from "@/lib/catalog";
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

export const MANAGER_STOCKING: Record<string, ManagerStock> = {
  "pzw-szczecin": {
    year: 2025,
    summary:
      "2025: m.in. Morzycko, Rega, Ina, Gowienica, Rejowice, Dolice, Mołstowa, Odra. Gatunki: szczupak, sandacz, węgorz, lin, karp, troć, łosoś. Ilości — tabela 2024 na stronie okręgu (2025 bez pełnego wykazu kg).",
    url: "https://pzwszczecin.com/zarybienia-2/zestawienie-zarybien-2024/",
    label: "Zarybienia PZW Szczecin",
  },
  "pzw-koszalin": {
    year: 2025,
    summary:
      "12.08.2025: 1008 kg narybku węgorza na jeziora okręgu (1259 ha), dofinansowanie WFOŚiGW. Koło Jesiotr (Szczecinek) rozwoziło największą partię. Brak pełnej tabeli po jeziorach za 2025.",
    url: "https://458.pzw.pl/szczegoly-artykulu/zarybianie-wegorzem_xs4lUXONAEBh58hJ42o4",
    label: "Zarybienie węgorzem 2025",
  },
  "pzw-gorzow": {
    year: 2025,
    summary:
      "2025: 20 341 600 szt. i 41 985 kg, wartość 2 078 026 zł. Wiosna: sielawa, szczupak, pstrąg, węgorz, sandacz; jesień: starszy narybek. PDF z podziałem na gminy na stronie okręgu.",
    url: "https://gorzow.pzw.pl/brepo/panel_repo/2026/03/25/6i51jh/zestawienie-zarybien-gminami-za-2025.pdf",
    label: "Zarybienia 2025 (PDF)",
  },
};

type Row = { name: string; species: string[]; hint?: string; year: number; again?: number };

const SZCZECIN = "https://pzwszczecin.com/zarybienia-2/zestawienie-zarybien-2024/";
const ZPW_2025 = "https://zpw.pl/pzw-szczecin/zarybienia-2025-w-okregu-pzw-szczecin/";
const JESIOTR = "https://pzw-szczecinek.pl/category/zarybienia/";
const GORZOW_PDF =
  "https://gorzow.pzw.pl/brepo/panel_repo/2026/03/25/6i51jh/zestawienie-zarybien-gminami-za-2025.pdf";

function sp(...ids: string[]) {
  return ids.filter((id) => SPECIES_BY_ID[id]);
}

const ROWS: Row[] = [
  { name: "Morzycko", year: 2024, again: 2025, species: sp("szczupak", "wegorz") },
  { name: "Koprowo", year: 2024, species: sp("szczupak", "sandacz", "wegorz") },
  { name: "Kołczewo", year: 2024, species: sp("sandacz", "wegorz", "lin") },
  { name: "Żółwino", year: 2024, species: sp("sandacz") },
  { name: "Żółwińskie", year: 2024, species: sp("lin") },
  { name: "Ostrowo", year: 2024, species: sp("szczupak", "sandacz", "wegorz") },
  { name: "Liwia Łuża", year: 2024, species: sp("szczupak", "wegorz", "bolen") },
  { name: "Kamienny Most", year: 2024, species: sp("szczupak") },
  { name: "Nowogardzkie", year: 2024, species: sp("szczupak") },
  { name: "Kiełbicze", year: 2024, species: sp("szczupak") },
  { name: "Lubicz", year: 2024, species: sp("szczupak") },
  { name: "Piaski", year: 2024, hint: "wolin", species: sp("szczupak", "sandacz") },
  { name: "Kościuszki", year: 2024, species: sp("szczupak", "wegorz", "lin", "karp") },
  { name: "Sierakowskie", year: 2024, species: sp("szczupak", "lin", "karp") },
  { name: "Chociwel", year: 2024, species: sp("szczupak", "sandacz", "wegorz", "lin", "karp") },
  { name: "Węgorzyno", year: 2024, species: sp("wegorz", "lin", "karp") },
  { name: "Portowe", year: 2024, again: 2025, species: sp("sandacz", "wegorz", "lin", "karp") },
  { name: "Budzieszowice", year: 2024, again: 2025, species: sp("sandacz", "wegorz", "karp") },
  { name: "Lechickie", year: 2024, species: sp("sandacz", "wegorz", "karp") },
  { name: "Okonie", year: 2024, species: sp("sandacz", "lin", "karp") },
  { name: "Szczucze", year: 2024, species: sp("sandacz", "wegorz", "lin", "karp") },
  { name: "Karsk", year: 2024, species: sp("sandacz", "lin", "karp") },
  { name: "Rokity", year: 2024, species: sp("sandacz", "lin", "karp", "karas") },
  { name: "Pyrzyckie", year: 2024, species: sp("karp", "karas") },
  { name: "Rejowice", year: 2024, again: 2025, species: sp("szczupak", "lin", "karp") },
  { name: "Dolice", year: 2024, again: 2025, species: sp("karp") },
  { name: "Czarnogłowy", year: 2024, species: sp("pstrag-potokowy", "pstrag-teczowy") },
  { name: "Czarnogłowy Duże", year: 2024, species: sp("pstrag-teczowy") },
  { name: "Maszewskie", year: 2024, species: sp("lin") },
  { name: "Klępnickie", year: 2024, species: sp("lin", "karp") },
  { name: "Mielno", year: 2024, hint: "pzw", species: sp("lin") },
  { name: "Dybrzno", year: 2024, species: sp("lin", "karp") },
  { name: "Jurkowo", year: 2024, species: sp("lin", "karp") },
  { name: "Barnkowskie", year: 2024, species: sp("lin", "karp", "karas") },
  { name: "Bartoszewo", year: 2024, species: sp("lin", "karp") },
  { name: "Głębokie", year: 2024, hint: "szczecin", species: sp("lin") },
  { name: "Parlino", year: 2024, species: sp("karp") },
  { name: "Warchlino", year: 2024, species: sp("karp") },
  { name: "Ziemomyśl", year: 2024, species: sp("karp") },
  { name: "Brzezina", year: 2024, species: sp("karp") },
  { name: "Tychowo", year: 2024, species: sp("karp", "wegorz") },
  { name: "Kiczarowo", year: 2024, species: sp("karp", "lin") },
  { name: "Łyse", year: 2024, species: sp("karp", "lin", "karas") },
  { name: "Piaseczno", year: 2024, hint: "szczecin", species: sp("szczupak", "karp") },
  { name: "Bukowe", year: 2024, species: sp("szczupak", "wegorz", "lin", "karp", "karas") },
  { name: "Czarne", year: 2024, hint: "pyrzyc", species: sp("sandacz", "wegorz", "lin", "karp", "karas") },
  { name: "Lubanowo", year: 2024, species: sp("karp") },
  { name: "Wirów", year: 2024, species: sp("karp") },
  { name: "Odra", year: 2024, again: 2025, species: sp("szczupak", "wegorz", "lin", "bolen", "certa", "klen", "losos", "mietus") },
  { name: "Ina", year: 2024, again: 2025, species: sp("szczupak", "jaz", "klen", "mietus", "pstrag-potokowy", "sum") },
  { name: "Rega", year: 2024, again: 2025, species: sp("certa", "jaz", "mietus", "pstrag-potokowy") },
  { name: "Płonia", year: 2024, species: sp("jaz", "mietus") },
  { name: "Gowienica", year: 2024, again: 2025, species: sp("jaz", "pstrag-potokowy") },
  { name: "Krępa", year: 2024, species: sp("szczupak", "lin", "jaz") },
  { name: "Gunica", year: 2024, species: sp("jaz") },
  { name: "Mołstowa", year: 2024, again: 2025, species: sp("pstrag-potokowy") },
  { name: "Tywa", year: 2024, species: sp("pstrag-potokowy") },
  { name: "Wołczenica", year: 2024, species: sp("jaz", "pstrag-potokowy") },
  { name: "Niemica", year: 2024, species: sp("jaz") },
  { name: "Świniec", year: 2024, species: sp("jaz") },
  { name: "Wilczkowo", year: 2024, species: sp("wegorz", "sandacz") },
  { name: "Trzesiecko", year: 2024, species: sp("wegorz") },
  { name: "Ciemino", year: 2024, species: sp("wegorz") },
  { name: "Radacz", year: 2024, species: sp("wegorz") },
  { name: "Barlineckie", year: 2025, species: sp("szczupak", "lin", "wegorz") },
  { name: "Uklejowe", year: 2025, species: sp("lin") },
  { name: "Zauklejowe", year: 2025, species: sp("lin") },
];

function keyOf(s: string) {
  return foldPl(
    sortName(s)
      .replace(/\s*\(.*\)\s*/g, " ")
      .replace(/\s*[–—-]\s*.*$/, "")
      .replace(/\s+(duze|male)$/i, "")
      .trim(),
  );
}

function hay(w: Water) {
  return foldPl([w.name, w.gmina ?? "", w.powiat ?? "", w.okrag ?? "", ...(w.aliases ?? [])].join(" "));
}

function matches(w: Water, row: Row) {
  const want = keyOf(row.name);
  if (want.length < 4) return false;
  const names = [w.name, ...(w.aliases ?? [])].map(keyOf);
  const hit = names.some((n) => n === want || n.startsWith(`${want} `) || want.startsWith(`${n} `));
  if (!hit) return false;
  if (row.hint && !hay(w).includes(foldPl(row.hint))) return false;
  return true;
}

const SRC: Record<number, { url: string; label: string }> = {
  2024: { url: SZCZECIN, label: "PZW Szczecin · tabela 2024" },
  2025: { url: ZPW_2025, label: "PZW Szczecin · zarybienia 2025" },
};

export function stockingOfWater(w: Water): WaterStock | null {
  const hits = ROWS.filter((r) => matches(w, r));
  if (!hits.length) return null;
  const species = [...new Set(hits.flatMap((r) => r.species))];
  const year = Math.max(...hits.map((r) => r.year));
  const again = hits.find((r) => r.again)?.again;
  const kosz = /wilczkowo|trzesiecko|ciemino|radacz/.test(keyOf(w.name));
  const gorz = /barlineckie|uklejowe|zauklejowe/.test(keyOf(w.name));
  const src = gorz
    ? { url: GORZOW_PDF, label: "PZW Gorzów · 2025" }
    : kosz
      ? { url: JESIOTR, label: "Koło Jesiotr · zarybienia" }
      : again
        ? { url: ZPW_2025, label: "PZW Szczecin · 2025" }
        : SRC[year] ?? SRC[2024];
  return {
    year,
    again,
    species,
    source: src.url,
    sourceLabel: src.label,
    note: again
      ? `Tabela ilości: ${year}. Okręg wymienia to łowisko też w ${again}.`
      : kosz
        ? "Zarybienie węgorzem (koło Jesiotr / okręg Koszalin). 2025: węgorz na jeziora okręgu — bez pełnej tabeli po wodach."
        : undefined,
  };
}

export function stockingOfManager(id: string | undefined | null) {
  if (!id) return null;
  return MANAGER_STOCKING[id] ?? null;
}
