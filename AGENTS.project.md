# Atlas wędkarski — snapshot rules (non-negotiable)

The Grok workspace **resets to an empty template** when a large catalog file
lands in `src/` or when a single JSON/bin blob is too heavy.

## Catalog

- Engine loads a voivodeship **pack**. Registry: `public/atlas/packs/index.json`
- Today: pack `zp` — **1204** łowisk in `public/atlas/packs/zp/waters/00.json` …
  (alphabetical by name, each ≤16 KB)
- Pack files: `manifest.json`, `managers.json`, `stocking.json`, `waters/`
- NEVER write `src/data/waters.json`, `.json.gz`, `public/data/waters.bin`, or `all.json`
- NEVER concatenate shards into one file to “inspect” them
- NEVER serve `/atlas/waters/all.json` or `/atlas/packs/*/waters/all.json` from Vite — 404 it
- NEVER read a shard in full in the agent — use `scripts/patch-water.mjs`

```sh
node scripts/patch-water.mjs --id dabie --get
node scripts/patch-water.mjs --id dabie --set lat=53.48
```

## Also never

- PNG/JPG screenshots over ~80 KB
- unused brand rasters (`fish-cutout.png`, `logo-karp.jpg`)
- `.grok/skills`, `node_modules`, `.vercel`

## Loader / SSR

- First splash is `#atlas-splash` in `__root.tsx`. CSS hides it after ~1.2 s
  even if React never hydrates. Do **not** put a percentage number on it.
- App mounts immediately under the overlay (not gated on catalog).
- `loadCatalog()` runs in `Boot` `useEffect` only. After shards load, bump
  `catalogReady` + `mapNonce`.
- NEVER write `all.json` to disk. NEVER preload a bundled catalog.
