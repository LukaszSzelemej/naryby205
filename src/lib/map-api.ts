import { BOUNDS } from "@/lib/catalog";
import type { Map as LeafletMap } from "leaflet";

declare global {
  interface Window {
    __atlasMap?: LeafletMap;
  }
}

export function zoomBy(delta: number) {
  const t = window.__atlasMap;
  if (!t) return;
  if (delta > 0) t.zoomIn(1);
  else t.zoomOut(1);
}

export function resetView() {
  const t = window.__atlasMap;
  if (!t) return;
  t.fitBounds(
    [
      [BOUNDS.south, BOUNDS.west],
      [BOUNDS.north, BOUNDS.east],
    ],
    { padding: [56, 32], animate: false },
  );
}

export function flyToUser(lat: number, lng: number) {
  window.__atlasMap?.flyTo([lat, lng], 15, { duration: 0.7, easeLinearity: 0.25 });
}

export function flyToSpot(lat: number, lng: number) {
  window.__atlasMap?.flyTo([lat, lng], 14, { duration: 0.4 });
}
