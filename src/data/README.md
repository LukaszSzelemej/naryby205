# Catalog files

- `species.json` and `managers.json` are small and editable.
- The 1204-water catalog is split alphabetically into `public/atlas/waters/*.json` (≤16 KB each).
- Coordinates: **PRNG** (GUGiK / geoportal.gov.pl, 2026-09-04) where the name uniquely matches.
- Area of ponds and commercial waters: **BDOT10k PTWP** water polygons from geoportal (orthophoto).
- Never write `src/data/waters.json` or `public/data/waters.bin`.
- Edit one łowisko with `node scripts/patch-water.mjs --id <id> --set field=value`.
