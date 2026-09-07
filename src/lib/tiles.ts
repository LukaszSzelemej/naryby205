import { BOUNDS } from "@/lib/catalog";

export const TILE_CACHE = "atlas-tiles-v5";

/** OSM Carto standard (osm.org) — w Polsce lokalne nazwy polskie, bez pary DE. Bez API. */
export const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
/** Zapas: Wikimedia OSM-intl, też lokalne nazwy. Nie osm.de (tam Stettin / Swinemünde). */
export const OSM_FALLBACK_URL = "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png";

export function osmTile(z: number, x: number, y: number) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function lng2tile(lng: number, z: number) {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}
function lat2tile(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z,
  );
}

export function tileList(zMin = 8, zMax = 11) {
  const urls: string[] = [];
  for (let z = zMin; z <= zMax; z++) {
    const x0 = lng2tile(BOUNDS.west, z);
    const x1 = lng2tile(BOUNDS.east, z);
    const y0 = lat2tile(BOUNDS.north, z);
    const y1 = lat2tile(BOUNDS.south, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        urls.push(osmTile(z, x, y));
      }
    }
  }
  return urls;
}
