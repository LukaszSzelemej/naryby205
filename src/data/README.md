# Catalog files

- `species.json` is national RAPR — stays in the engine.
- Voivodeship data lives in `public/atlas/packs/<id>/` (today: `zp`).
  - `manifest.json` — bounds, center, version
  - `managers.json` — hosts, permits, hostById
  - `stocking.json` — stocking notes
  - `waters/*.json` — alphabetical shards (≤16 KB)
- Pack registry: `public/atlas/packs/index.json`
- Coordinates: **PRNG** (GUGiK / geoportal.gov.pl, 2026-09-04) where the name uniquely matches.
- Area of ponds and commercial waters: **BDOT10k PTWP** water polygons from geoportal (orthophoto).
- Never write `src/data/waters.json` or `public/data/waters.bin`.
- Edit one łowisko with `node scripts/patch-water.mjs --id <id> --set field=value`.
