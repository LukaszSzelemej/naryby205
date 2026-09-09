#!/usr/bin/env node
/**
 * Write public/atlas/packs/<id>/waters/*.json shards (≤16 KB, sorted by name).
 * Never dump the full catalog into src/.
 *
 *   node scripts/split-catalog.mjs            # rewrite zp (default)
 *   node scripts/split-catalog.mjs zp         # rewrite that pack
 *   node scripts/split-catalog.mjs lb
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MAX = 16_000;

export function packWatersDir(packId = "zp") {
  if (!/^[a-z][a-z0-9-]*$/.test(packId)) throw new Error(`bad pack ${packId}`);
  return resolve(`public/atlas/packs/${packId}/waters`);
}

export function writeShards(waters, dest = packWatersDir()) {
  const rows = [...waters].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "pl", { sensitivity: "base" }),
  );
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(dest)) {
    if (name.endsWith(".json")) rmSync(join(dest, name));
  }
  const dump = (chunk) => JSON.stringify(chunk);
  const shards = [];
  let chunk = [];
  let i = 0;
  const flush = () => {
    if (!chunk.length) return;
    const name = `${String(i).padStart(2, "0")}.json`;
    writeFileSync(join(dest, name), dump(chunk));
    shards.push(name);
    i += 1;
    chunk = [];
  };
  for (const w of rows) {
    const trial = [...chunk, w];
    if (chunk.length && Buffer.byteLength(dump(trial), "utf8") > MAX) flush();
    chunk.push(w);
  }
  flush();
  writeFileSync(join(dest, "index.json"), JSON.stringify({ n: rows.length, shards }));
  return shards;
}

export function readShards(dest = packWatersDir()) {
  const idx = JSON.parse(readFileSync(join(dest, "index.json"), "utf8"));
  return idx.shards.flatMap((name) => JSON.parse(readFileSync(join(dest, name), "utf8")));
}

export function writePackShards(packId, waters) {
  return writeShards(waters, packWatersDir(packId));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = process.argv[2] || "zp";
  const dest = packWatersDir(pack);
  const rows = readShards(dest);
  const shards = writeShards(rows, dest);
  const sizes = shards.map((name) => {
    const n = Buffer.byteLength(readFileSync(join(dest, name)));
    return { name, n };
  });
  const max = Math.max(...sizes.map((s) => s.n));
  console.log(`${pack}: ${rows.length} waters, ${shards.length} shards, max ${max} B`);
}
