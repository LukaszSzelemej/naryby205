#!/usr/bin/env node
/**
 * Write public/atlas/packs/zp/waters/*.json shards (≤16 KB, sorted by name).
 * Never dump the full catalog into src/.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DIR = resolve("public/atlas/packs/zp/waters");
const MAX = 16_000;

export function writeShards(waters) {
  const rows = [...waters].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "pl", { sensitivity: "base" }),
  );
  mkdirSync(DIR, { recursive: true });
  for (const name of readdirSync(DIR)) {
    if (name.endsWith(".json")) rmSync(join(DIR, name));
  }
  const dump = (chunk) => JSON.stringify(chunk);
  const shards = [];
  let chunk = [];
  let i = 0;
  const flush = () => {
    if (!chunk.length) return;
    const name = `${String(i).padStart(2, "0")}.json`;
    writeFileSync(join(DIR, name), dump(chunk));
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
  writeFileSync(join(DIR, "index.json"), JSON.stringify({ n: rows.length, shards }));
  return shards;
}

export function readShards() {
  const idx = JSON.parse(readFileSync(join(DIR, "index.json"), "utf8"));
  return idx.shards.flatMap((name) => JSON.parse(readFileSync(join(DIR, name), "utf8")));
}
