#!/usr/bin/env node
/**
 * Patch a single water without assembling src/data/waters.json.
 *
 *   node scripts/patch-water.mjs --id golczewo --get
 *   node scripts/patch-water.mjs --pack zp --id dabie --set lat=53.48
 */
import { packWatersDir, readShards, writeShards } from "./split-catalog.mjs";

const args = process.argv.slice(2);
const id = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
const pack = args.includes("--pack") ? args[args.indexOf("--pack") + 1] : "zp";
const get = args.includes("--get");
const sets = args
  .map((a, i) => (a === "--set" ? args[i + 1] : null))
  .filter(Boolean);

if (!id) {
  console.error("usage: node scripts/patch-water.mjs [--pack zp] --id <id> [--get] [--set field=value]");
  process.exit(1);
}

const dest = packWatersDir(pack);
const waters = readShards(dest);
const w = waters.find((row) => row.id === id);
if (!w) {
  console.error(`no water id=${id} in pack ${pack}`);
  process.exit(1);
}

if (get && !sets.length) {
  console.log(JSON.stringify(w, null, 2));
  process.exit(0);
}

for (const pair of sets) {
  const eq = pair.indexOf("=");
  if (eq < 1) {
    console.error(`bad --set ${pair}`);
    process.exit(1);
  }
  const key = pair.slice(0, eq);
  let value = pair.slice(eq + 1);
  if (value === "true") value = true;
  else if (value === "false") value = false;
  else if (value === "null") value = null;
  else if (/^-?\d+(\.\d+)?$/.test(value)) value = Number(value);
  w[key] = value;
}

writeShards(waters, dest);
console.log(`patched ${id} → public/atlas/packs/${pack}/waters/*.json`);
if (get) console.log(JSON.stringify(w, null, 2));
