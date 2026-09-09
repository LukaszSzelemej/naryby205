import type { WeatherNow } from "@/lib/types";
import { METHOD_LABEL, protectionOf, SPECIES_BY_ID } from "@/lib/catalog";

export type Moon = { frac: number; name: string; illum: number };

export function moonPhase(at: Date = new Date()): Moon {
  const synodic = 29.53058867;
  const known = Date.UTC(2000, 0, 6, 18, 14);
  const frac = (((at.getTime() - known) / 86400000) % synodic + synodic) % synodic / synodic;
  const illum = Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100);
  let name = "sierp";
  if (frac < 0.03 || frac > 0.97) name = "nów";
  else if (frac < 0.22) name = "przybywający sierp";
  else if (frac < 0.28) name = "pierwsza kwadra";
  else if (frac < 0.47) name = "przybywający garb";
  else if (frac < 0.53) name = "pełnia";
  else if (frac < 0.72) name = "ubywający garb";
  else if (frac < 0.78) name = "ostatnia kwadra";
  else name = "ubywający sierp";
  return { frac, name, illum };
}

export function feedingScore(w: WeatherNow, at: Date = new Date()) {
  let n = 55;
  if (w.pressureTrend === "down") n += 18;
  else if (w.pressureTrend === "up") n -= 8;
  if (w.pressure >= 1008 && w.pressure <= 1022) n += 8;
  if (w.precipitation > 1) n -= 10;
  const m = moonPhase(at);
  if (m.frac > 0.42 && m.frac < 0.58) n += 6;
  if (m.frac < 0.08 || m.frac > 0.92) n += 4;
  const h = at.getHours();
  if (h <= 8 || h >= 18) n += 10;
  return Math.max(8, Math.min(98, n));
}

export function feedingLabel(score: number) {
  if (score >= 75) return "Bardzo dobre";
  if (score >= 58) return "Dobre";
  if (score >= 42) return "Umiarkowane";
  return "Słabe";
}

export function feedingTone(score: number): "ok" | "primary" | "warn" | "danger" {
  if (score >= 75) return "ok";
  if (score >= 58) return "primary";
  if (score >= 42) return "warn";
  return "danger";
}

export function biomet(w: WeatherNow) {
  let t = 68;
  if (w.pressure < 1000 || w.pressure > 1028) t -= 16;
  else if (w.pressure >= 1012 && w.pressure <= 1022) t += 8;
  if (w.pressureTrend === "down") t -= 12;
  else if (w.pressureTrend === "up") t -= 4;
  if (w.humidity > 88) t -= 10;
  else if (w.humidity < 40) t -= 4;
  if (w.wind > 40) t -= 16;
  else if (w.wind > 28) t -= 8;
  if (w.precipitation > 4) t -= 14;
  else if (w.precipitation > 1) t -= 6;
  if (w.weatherCode >= 95) t -= 18;
  else if (w.weatherCode >= 61) t -= 8;
  else if (w.weatherCode === 0 || w.weatherCode === 1) t += 6;
  if (w.temp < 0 || w.temp > 31) t -= 8;
  if (t >= 62) {
    return {
      label: "Korzystny",
      tone: "ok" as const,
      detail:
        "Stabilne ciśnienie i umiarkowany wiatr. Organizm znosi warunki dobrze — spokojny dzień nad wodą.",
    };
  }
  if (t >= 42) {
    return {
      label: "Obojętny",
      tone: "warn" as const,
      detail:
        "Zmienne warunki. Osoby wrażliwe na ciśnienie mogą czuć zmęczenie; większość wędkarzy bez zmian.",
    };
  }
  return {
    label: "Niekorzystny",
    tone: "danger" as const,
    detail:
      "Front, skoki ciśnienia albo silny wiatr. Bóle głowy i spadek koncentracji bywają częstsze — krótsza sesja, ciepły ubiór.",
  };
}

export function dayParts(w: WeatherNow) {
  return [
    { id: "swit", label: "Świt", hour: 5 },
    { id: "dzien", label: "Dzień", hour: 13 },
    { id: "zmierzch", label: "Zmierzch", hour: 19 },
    { id: "noc", label: "Noc", hour: 23 },
  ].map((p) => {
    const d = new Date();
    d.setHours(p.hour, 0, 0, 0);
    const score = feedingScore(w, d);
    return { ...p, score, text: feedingLabel(score) };
  });
}

export function feedingTips(w: WeatherNow) {
  const t: { title: string; text: string }[] = [];
  if (w.wind < 8) {
    t.push({
      title: "Wiatr",
      text: "Cisza. Gładka tafla — dobry spławik, słabsze napowietrzenie. Szukaj spadku i roślin.",
    });
  } else if (w.wind < 28) {
    t.push({
      title: "Wiatr",
      text: "Lekki–umiarkowany wiatr napowietrza wodę. Drapieżnik i leszcz.",
    });
  } else if (w.wind < 42) {
    t.push({
      title: "Wiatr",
      text: "Silny wiatr. Żer na nawietrznej, brzeg i spinning z lądu trudniejsze.",
    });
  } else {
    t.push({
      title: "Wiatr",
      text: "Bardzo silny wiatr. Łódź i otwarty brzeg odpadają — zatoka albo inny dzień.",
    });
  }
  if (w.pressureTrend === "down") {
    t.push({
      title: "Ciśnienie",
      text: "Spadające ciśnienie. Drapieżnik zwykle rusza, warto spinning i trolling.",
    });
  } else if (w.pressureTrend === "up") {
    t.push({
      title: "Ciśnienie",
      text: "Rosnące ciśnienie. Po froncie brania często cichną — method i grunt, wolniejsza prezentacja.",
    });
  } else {
    t.push({
      title: "Ciśnienie",
      text: "Stabilne ciśnienie. Równe żerowanie, dobry dzień na grunt i spławik.",
    });
  }
  const n = w.weatherCode;
  if (n <= 1) {
    t.push({
      title: "Niebo",
      text: "Słońce. Żer rano i wieczorem; w południe cień, głębia i rośliny.",
    });
  } else if (n === 2) {
    t.push({
      title: "Niebo",
      text: "Pogodnie, chmury. Żer przez dzień, dobry spinning i grunt.",
    });
  } else if (n === 3 || n === 45 || n === 48) {
    t.push({
      title: "Niebo",
      text: "Pochmurno — żer przez dzień, dobry spinning i grunt.",
    });
  } else {
    t.push({
      title: "Niebo",
      text: "Zmienne niebo. Okna między opadami; drapieżnik często tuż przed frontem.",
    });
  }
  if (w.precipitation < 0.2) t.push({ title: "Opad", text: "Bez opadu." });
  else if (w.precipitation < 2) {
    t.push({
      title: "Opad",
      text: "Lekki opad. Nie psuje żeru — leszcz i płoć często biorą.",
    });
  } else {
    t.push({
      title: "Opad",
      text: "Wyraźny opad. Po burzy zwykle przerwa; wracaj gdy ciśnienie się uspokoi.",
    });
  }
  if (w.temp < 8) {
    t.push({
      title: "Powietrze",
      text: "Zimno. Powoli, mała przynęta, głębia. Szczupak i okoń.",
    });
  } else if (w.temp < 16) {
    t.push({
      title: "Powietrze",
      text: "Chłodno. Drapieżnik aktywny cały dzień, karp jeszcze ociężały.",
    });
  } else if (w.temp < 26) {
    t.push({
      title: "Powietrze",
      text: "Ciepło. Rano i zmierzch, w dzień tlen przy wietrze i roślinach.",
    });
  } else {
    t.push({
      title: "Powietrze",
      text: "Gorąco. Świt, zmierzch i noc. W dzień cień, głęboka woda, mniej zanęty.",
    });
  }
  const r = w.waterTemp;
  if (r == null) {
    t.push({
      title: "Woda",
      text: "Brak pomiaru temperatury wody — orientuj się powietrzem i porą roku.",
    });
  } else if (r < 10) {
    t.push({
      title: "Woda",
      text: "Zimna woda. Szczupak, okoń, sieja. Karp i lin jeszcze śpią.",
    });
  } else if (r < 16) {
    t.push({
      title: "Woda",
      text: "Woda w oknie drapieżnika. Sandacz i szczupak, method na leszcza.",
    });
  } else if (r < 24) {
    t.push({
      title: "Woda",
      text: "Ciepła woda. Karp, lin, amur. Drapieżnik rano i wieczorem.",
    });
  } else {
    t.push({
      title: "Woda",
      text: "Bardzo ciepła woda. Tlen przy wietrze i roślinach, noce lepsze niż południe.",
    });
  }
  return t;
}

export function forecastFeeding(w: WeatherNow) {
  return w.daily.slice(0, 7).map((d) => {
    const at = new Date(`${d.date}T08:00:00`);
    const fake: WeatherNow = {
      ...w,
      temp: (d.tmax + d.tmin) / 2,
      precipitation: d.rain,
      wind: d.wind,
      weatherCode: d.weatherCode,
    };
    const score = feedingScore(fake, at);
    return { date: d.date, score, text: feedingLabel(score), day: d };
  });
}

type WaterBand = {
  id: string;
  lo: number;
  hi: number;
  peakLo: number;
  peakHi: number;
  method?: string;
};

const WATER_BANDS: WaterBand[] = [
  { id: "mietus", lo: 1, hi: 10, peakLo: 2, peakHi: 7 },
  { id: "pstrag-potokowy", lo: 4, hi: 16, peakLo: 6, peakHi: 12, method: "mucha" },
  { id: "szczupak", lo: 4, hi: 18, peakLo: 8, peakHi: 12, method: "spinning" },
  { id: "okon", lo: 6, hi: 18, peakLo: 8, peakHi: 14, method: "spinning" },
  { id: "sandacz", lo: 8, hi: 20, peakLo: 10, peakHi: 16, method: "spinning" },
  { id: "leszcz", lo: 10, hi: 20, peakLo: 12, peakHi: 17, method: "method feeder" },
  { id: "ploc", lo: 8, hi: 20, peakLo: 10, peakHi: 16, method: "spławik" },
  { id: "bolen", lo: 10, hi: 22, peakLo: 12, peakHi: 18, method: "spinning" },
  { id: "lin", lo: 14, hi: 24, peakLo: 16, peakHi: 21, method: "spławik" },
  { id: "karp", lo: 14, hi: 26, peakLo: 17, peakHi: 23, method: "method feeder" },
  { id: "wegorz", lo: 14, hi: 24, peakLo: 16, peakHi: 22, method: "grunt" },
  { id: "amur", lo: 16, hi: 28, peakLo: 18, peakHi: 24, method: "method feeder" },
  { id: "sum", lo: 16, hi: 28, peakLo: 18, peakHi: 24, method: "grunt" },
];

function bandScore(t: number, b: WaterBand) {
  if (t < b.lo || t > b.hi) return 0;
  if (t >= b.peakLo && t <= b.peakHi) return 2;
  return 1;
}

export type WaterSpeciesHint = {
  temp: number;
  chips: { id: string; name: string; peak: boolean }[];
  closed: string[];
  text: string;
};

export function waterSpeciesHint(
  temp: number | null | undefined,
  species: string[] = [],
  methods: string[] = [],
  atSea = false,
): WaterSpeciesHint | null {
  if (temp == null || !Number.isFinite(temp)) return null;
  const pool = species.length ? species : WATER_BANDS.map((b) => b.id);
  const allow = new Set(methods);
  const hits = WATER_BANDS.filter((b) => pool.includes(b.id))
    .map((b) => {
      const sp = SPECIES_BY_ID[b.id];
      const closed = sp ? protectionOf(sp, new Date(), atSea).active : false;
      return {
        id: b.id,
        name: sp?.name ?? b.id,
        score: bandScore(temp, b),
        closed,
        method: b.method,
      };
    })
    .filter((h) => h.score > 0);
  const open = hits
    .filter((h) => !h.closed)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pl"));
  const peak = open.filter((h) => h.score === 2);
  const chips = (peak.length ? peak : open).slice(0, 4).map((h) => ({
    id: h.id,
    name: h.name,
    peak: h.score === 2,
  }));
  const closed = hits
    .filter((h) => h.closed && h.score === 2)
    .map((h) => h.name);
  const names = chips.map((c) => c.name);
  const bits: string[] = [];
  if (names.length) {
    bits.push(
      chips.some((c) => c.peak)
        ? `${names.join(", ")} — woda w ich oknie.`
        : `${names.join(", ")} — raczej biorą, ale to nie szczyt sezonu.`,
    );
  } else {
    bits.push(`Przy ${temp.toFixed(0)}° żaden z gatunków tego łowiska nie jest w typowym oknie.`);
  }
  const methodIds = [
    ...new Set(
      (peak.length ? peak : open)
        .slice(0, 4)
        .map((h) => h.method)
        .filter((m): m is string => Boolean(m))
        .filter((m) => !allow.size || allow.has(m)),
    ),
  ];
  if (methodIds.length) {
    bits.push(methodIds.map((m) => METHOD_LABEL[m] ?? m).join(", ") + ".");
  }
  if (pool.includes("karp") && temp < 14 && !hits.find((h) => h.id === "karp" && h.closed)) {
    bits.push("Karp jeszcze ociężały.");
  }
  if (pool.includes("sum") && temp < 16) bits.push("Sum czeka na cieplejszą wodę.");
  if (closed.length) bits.push(`${closed.join(", ")} w ochronie — nie łów.`);
  return { temp, chips, closed, text: bits.join(" ") };
}
