#!/usr/bin/env node
/**
 * Patch a single water without assembling src/data/waters.json.
 *
 *   node scripts/patch-water.mjs --id golczewo --set socialUrl=https://...
 *   node scripts/patch-water.mjs --id dabie --get
 */
import { readShards, writeShards } from "./split-catalog.mjs";

const args = process.argv.slice(2);
const id = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
const get = args.includes("--get");
const sets = args
  .map((a, i) => (a === "--set" ? args[i + 1] : null))
  .filter(Boolean);

if (!id) {
  console.error("usage: node scripts/patch-water.mjs --id <id> [--get] [--set field=value]");
  process.exit(1);
}

const waters = readShards();
const w = waters.find((row) => row.id === id);
if (!w) {
  console.error(`no water id=${id}`);
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

writeShards(waters);
console.log(`patched ${id} → public/atlas/packs/zp/waters/*.json`);
if (get) console.log(JSON.stringify(w, null, 2));
