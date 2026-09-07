#!/usr/bin/env node
import { readShards, writeShards } from "./split-catalog.mjs";

/** Miasta na prawach powiatu — gmina = nazwa powiatu. */
const CITY_POWIAT = new Set(["Szczecin", "Koszalin", "Świnoujście", "Kołobrzeg"]);

const GMINA = {
  "bulwar-gdanski": "Szczecin",
  "bulwary-ladoga": "Szczecin",
  "cichy-staw": "Szczecin",
  "gorny-staw": "Szczecin",
  kopice: "Szczecin",
  ostroleka: "Szczecin",
  "polny-staw": "Szczecin",
  "wegorzy-kat": "Szczecin",
  bagno: "Golczewo",
  baranowko: "Boleszkowice",
  bolen: "Wolin",
  diably: "Wolin",
  "dobroweckie-wielkie": "Białogard",
  "gleboki-nurt": "Wolin",
  "jasny-staw": "Cedynia",
  "karpinka-2": "Świerzno",
  "karskie-wielkie": "Nowogródek Pomorski",
  klodawa: "Dębno",
  "male-milogoskie": "Tuczno",
  mialkie: "Boleszkowice",
  "mysliborskie-male": "Nowe Warpno",
  "mysliborskie-wielkie": "Nowe Warpno",
  "mlynskie-wielkie": "Tuczno",
  promna: "Świerzno",
  "rajsko-duze": "Recz",
  "rajsko-male": "Recz",
  smardzewo: "Malechowo",
  "stara-zwirownia": "Cedynia",
  zbrzyca: "Myślibórz",
  scienne: "Ińsko",
  roztoka: "Goleniów",
  "zalew-szczecinski": "Police",
};

/** Wikipedia / urząd gminy / atlas jezior — nie zgadujemy. */
const DEPTH = {
  "zamkowe-walcz": { maxDepthM: 41.5, avgDepthM: 12.9 },
  letowskie: { maxDepthM: 18.7, avgDepthM: 8.2 },
  "radun-walcz": { maxDepthM: 25.1, avgDepthM: 9.5 },
  metno: { maxDepthM: 4, avgDepthM: 2.5 },
  "dlugie-banie": { maxDepthM: 6.8, avgDepthM: 4.2 },
  ostrowieckie: { maxDepthM: 7.5, avgDepthM: 3.3 },
  strzeszowskie: { maxDepthM: 14.2, avgDepthM: 7.4 },
  ostrow: { maxDepthM: 10, avgDepthM: 4.4 },
};

function foldPl(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "l");
}

function inferNight(w) {
  const blob = foldPl([...(w.rules ?? []), w.ticket ?? "", w.summary ?? ""].join(" "));
  if (/zakaz.{0,28}noc|bez nocy|nie wolno.{0,18}noc/.test(blob)) return false;
  if (/\bnoc(y|a|nego|leg)?\b/.test(blob)) return true;
  if (w.featured) return true;
  if (w.kind === "morze" || w.kind === "zalew" || w.kind === "kanal") return true;
  if (w.kind === "jezioro" && (w.areaHa ?? 0) >= 50) return true;
  return false;
}

const waters = readShards();
const byId = new Set(waters.map((w) => w.id));
for (const id of Object.keys(GMINA)) {
  if (!byId.has(id)) throw new Error(`unknown gmina id ${id}`);
}
for (const id of Object.keys(DEPTH)) {
  if (!byId.has(id)) throw new Error(`unknown depth id ${id}`);
}

let g = 0;
let d = 0;
let nTrue = 0;
for (const w of waters) {
  if (!w.gmina && CITY_POWIAT.has(w.powiat)) {
    w.gmina = w.powiat;
    g += 1;
  } else if (!w.gmina && GMINA[w.id]) {
    w.gmina = GMINA[w.id];
    g += 1;
  }
  const depth = DEPTH[w.id];
  if (depth) {
    if (!w.maxDepthM) {
      w.maxDepthM = depth.maxDepthM;
      d += 1;
    }
    if (!w.avgDepthM) w.avgDepthM = depth.avgDepthM;
  }
  w.night = inferNight(w);
  if (w.night) nTrue += 1;
}
writeShards(waters);
console.log(`gmina+ ${g}, depth+ ${d}, night true ${nTrue}/${waters.length}`);
