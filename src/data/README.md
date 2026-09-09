# Catalog files

- `species.json` is national RAPR — stays in the engine.
- Voivodeship data lives in `public/atlas/packs/<id>/` (`zp`, `lb`).
  - `manifest.json` — bounds, center, version
  - `managers.json` — hosts, permits, hostById
  - `stocking.json` — stocking notes
  - `waters/*.json` — alphabetical shards (≤16 KB)
- Pack registry: `public/atlas/packs/index.json`
- Coordinates: **PRNG** / OSM / Nominatim. Missing pins fall back to gmina centre (rule on the card).
- Never write `src/data/waters.json` or `public/data/waters.bin`.
- Edit one łowisko with `node scripts/patch-water.mjs --pack <id> --id <id> --set field=value`.
