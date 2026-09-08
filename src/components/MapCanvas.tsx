import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, TileLayer } from "leaflet";
import {
  BOUNDS,
  DEFAULT_ZOOM,
  MAP_CENTER,
  matchesFilter,
  pinColor,
  WATERS,
} from "@/lib/catalog";
import { TILE_URL, TILE_FALLBACK_URL, TILE_OPTS } from "@/lib/tiles";
import { useAtlas } from "@/lib/store";
import type { MapFilter, Water } from "@/lib/types";
import { flyToUser, resetView } from "@/lib/map-api";
import { cn } from "@/lib/utils";

const leafletReady =
  typeof window === "undefined"
    ? null
    : Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]);

const PIN_RATIO = 162 / 256;
const pinImg: HTMLImageElement | null =
  typeof Image === "undefined"
    ? null
    : Object.assign(new Image(), {
        decoding: "async",
        src: "/brand/fish-pin.png?v=origami",
      });

const pinCache = new Map<string, HTMLCanvasElement>();

function hexRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function tintedPin(color: string) {
  const hit = pinCache.get(color);
  if (hit) return hit;
  if (!pinImg?.naturalWidth) return null;
  const w = 96;
  const h = Math.round(w * PIN_RATIO);
  const pad = 12;

  const raw = document.createElement("canvas");
  raw.width = w;
  raw.height = h;
  const rctx = raw.getContext("2d");
  if (!rctx) return null;
  rctx.drawImage(pinImg, 0, 0, w, h);
  const img = rctx.getImageData(0, 0, w, h);
  const d = img.data;
  const [cr, cg, cb] = hexRgb(color);
  const mr = Math.min(255, cr * 1.18);
  const mg = Math.min(255, cg * 1.18);
  const mb = Math.min(255, cb * 1.18);
  const sr = cr * 0.4;
  const sg = cg * 0.4;
  const sb = cb * 0.4;
  const hr = Math.min(255, mr + (255 - mr) * 0.32);
  const hg = Math.min(255, mg + (255 - mg) * 0.32);
  const hb = Math.min(255, mb + (255 - mb) * 0.32);

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    const lum = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255;
    const t = lum ** 0.85;
    let r: number;
    let g: number;
    let b: number;
    if (t < 0.55) {
      const k = t / 0.55;
      r = sr + (mr - sr) * k;
      g = sg + (mg - sg) * k;
      b = sb + (mb - sb) * k;
    } else {
      const k = (t - 0.55) / 0.45;
      r = mr + (hr - mr) * k;
      g = mg + (hg - mg) * k;
      b = mb + (hb - mb) * k;
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  rctx.putImageData(img, 0, 0);

  const c = document.createElement("canvas");
  c.width = w + pad * 2;
  c.height = h + pad * 2;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.shadowColor = "rgba(8, 12, 16, 0.42)";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(raw, pad, pad);
  pinCache.set(color, c);
  return c;
}

function pinScore(w: Water, fav: Set<string>) {
  let s = 4;
  if (typeof w.areaHa === "number" && w.areaHa > 0) s += Math.min(w.areaHa, 4000);
  else if (typeof w.lengthKm === "number") s += w.lengthKm * 14;
  if (w.featured) s += 220;
  if (w.kind === "morze" || w.kind === "zalew") s += 40;
  if (w.kind === "rzeka") s += 18;
  if (fav.has(w.id)) s += 800;
  return s;
}

function gridDeg(z: number) {
  if (z < 8) return 0.3;
  if (z < 8.6) return 0.22;
  if (z < 9.2) return 0.145;
  if (z < 10) return 0.09;
  if (z < 11) return 0.052;
  if (z < 12) return 0.03;
  if (z < 13) return 0.016;
  return 0;
}

function pickVisible(
  list: Water[],
  south: number,
  north: number,
  west: number,
  east: number,
  z: number,
  fav: Set<string>,
): { w: Water; pack: Water[] }[] {
  const inView: Water[] = [];
  for (const w of list) {
    if (w.lat < south || w.lat > north || w.lng < west || w.lng > east) continue;
    inView.push(w);
  }
  const cs = gridDeg(z);
  if (!cs || z >= 11.2 || inView.length <= 50) {
    return inView.map((w) => ({ w, pack: [w] }));
  }
  const cells = new Map<string, Water[]>();
  for (const w of inView) {
    const key = `${Math.floor(w.lat / cs)}:${Math.floor(w.lng / cs)}`;
    const arr = cells.get(key);
    if (arr) arr.push(w);
    else cells.set(key, [w]);
  }
  return Array.from(cells.values()).map((pack) => {
    let best = pack[0];
    let bestSc = pinScore(best, fav);
    for (const w of pack) {
      const sc = pinScore(w, fav);
      if (sc > bestSc) {
        best = w;
        bestSc = sc;
      }
    }
    return { w: best, pack };
  });
}

function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  const spr = tintedPin(color);
  if (!spr) return;
  const w = 38 * scale;
  const h = w * PIN_RATIO;
  const pad = (12 / 96) * w;
  ctx.drawImage(spr, x - w * 0.52 - pad, y - h * 0.55 - pad, w + pad * 2, h + pad * 2);
}

export function MapCanvas({
  filter,
  onOpen,
  onCluster,
  visible = true,
}: {
  filter: MapFilter;
  onOpen: (id: string) => void;
  onCluster?: (ids: string[]) => void;
  visible?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const hereRef = useRef<Marker | null>(null);
  const osmRef = useRef<TileLayer | null>(null);
  const listRef = useRef<Water[]>([]);
  const shownRef = useRef<{ w: Water; pack: Water[] }[]>([]);
  const favRef = useRef<Set<string>>(new Set());
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onClusterRef = useRef(onCluster);
  onClusterRef.current = onCluster;
  const [ready, setReady] = useState(false);
  const [veilOut, setVeilOut] = useState(false);
  const [hideVeil, setHideVeil] = useState(false);
  const geo = useAtlas((s) => s.geo);
  const favs = useAtlas((s) => s.favorites);
  const mapNonce = useAtlas((s) => s.mapNonce);
  const catalogReady = useAtlas((s) => s.catalogReady);
  const mapSpecies = useAtlas((s) => s.mapSpecies);
  const mapNight = useAtlas((s) => s.mapNight);
  const mapBoats = useAtlas((s) => s.mapBoats);
  const mapDark = useAtlas((s) => s.mapDark);

  const redraw = () => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas || !visibleRef.current) return;
    const size = map.getSize();
    if (size.x < 2 || size.y < 2) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tw = Math.round(size.x * dpr);
    const th = Math.round(size.y * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);
    const b = map.getBounds();
    const z = map.getZoom();
    const shown = pickVisible(
      listRef.current,
      b.getSouth(),
      b.getNorth(),
      b.getWest(),
      b.getEast(),
      z,
      favRef.current,
    );
    shownRef.current = shown;
    canvas.dataset.pins = String(shown.length);
    const scale = z < 8.5 ? 1.18 : z < 10 ? 1.08 : z < 12 ? 1.02 : 0.95;
    const f = filterRef.current;
    for (const item of shown) {
      const p = map.latLngToContainerPoint([item.w.lat, item.w.lng]);
      drawFish(ctx, p.x, p.y, scale, pinColor(item.w, f));
    }
  };

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    let cancelled = false;
    let map: LeafletMap | undefined;
    let onMove: (() => void) | undefined;
    let onClick: ((e: { containerPoint?: { x: number; y: number } }) => void) | undefined;
    let onPinLoad: (() => void) | undefined;
    let idle = 0;
    let ro: ResizeObserver | undefined;

    const start = async () => {
      const pack = await leafletReady;
      if (!pack || cancelled || !host.current) return;
      const L = pack[0].default;

      map = L.map(host.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: false,
        zoomAnimation: true,
        markerZoomAnimation: false,
        preferCanvas: true,
        minZoom: 7,
        maxZoom: 17,
        maxBounds: L.latLngBounds(
          [BOUNDS.south - 0.35, BOUNDS.west - 0.4],
          [BOUNDS.north + 0.35, BOUNDS.east + 0.4],
        ),
        maxBoundsViscosity: 0.7,
      }).setView(MAP_CENTER, DEFAULT_ZOOM);

      let usedFallback = false;
      const dropVeil = () => {
        if (cancelled) return;
        setVeilOut(true);
        window.setTimeout(() => setHideVeil(true), 280);
      };
      osmRef.current = L.tileLayer(TILE_URL, TILE_OPTS);
      osmRef.current.on("tileerror", () => {
        if (usedFallback || cancelled) return;
        usedFallback = true;
        const live = mapRef.current;
        if (!live || !osmRef.current) return;
        live.removeLayer(osmRef.current);
        osmRef.current = L.tileLayer(TILE_FALLBACK_URL, {
          maxZoom: 19,
          keepBuffer: 2,
          updateWhenIdle: false,
          updateWhenZooming: true,
          crossOrigin: true,
        });
        osmRef.current.on("load", dropVeil);
        osmRef.current.addTo(live);
        osmRef.current.bringToBack();
      });
      osmRef.current.on("load", dropVeil);
      osmRef.current.addTo(map);
      mapRef.current = map;
      window.__atlasMap = map;
      if (host.current && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          if (cancelled) return;
          const live = mapRef.current;
          if (!live) return;
          live.invalidateSize({ animate: false });
          redraw();
        });
        ro.observe(host.current);
      }
      if (useAtlas.getState().mapDark) host.current?.classList.add("is-dark");
      const st = useAtlas.getState();
      const here = st.geo;
      const favSet = new Set(st.favorites);
      favRef.current = favSet;
      listRef.current = WATERS.filter((w) => {
        if (!matchesFilter(w, filterRef.current, favSet)) return false;
        if (st.mapSpecies.length && !st.mapSpecies.every((id) => w.species.includes(id))) return false;
        if (st.mapNight && !w.night) return false;
        if (st.mapBoats && !w.boats) return false;
        return true;
      });
      if (here) {
        map.setView([here.lat, here.lng], 15);
      } else {
        map.fitBounds(
          L.latLngBounds([BOUNDS.south, BOUNDS.west], [BOUNDS.north, BOUNDS.east]),
          { padding: [56, 32], animate: false },
        );
      }

      let raf = 0;
      onMove = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          redraw();
        });
      };
      onClick = (e) => {
        const pt = e.containerPoint;
        if (!pt) return;
        const { x, y } = pt;
        const m = mapRef.current;
        if (!m) return;
        const z = m.getZoom();
        const hit = z < 9 ? 22 : z < 12 ? 20 : 18;
        let best: { w: Water; pack: Water[] } | null = null;
        let bestD = hit;
        const near: Water[] = [];
        for (const item of shownRef.current) {
          const p = m.latLngToContainerPoint([item.w.lat, item.w.lng]);
          const d = Math.hypot(p.x - x, p.y - y);
          if (d < hit) near.push(...item.pack);
          if (d < bestD) {
            bestD = d;
            best = item;
          }
        }
        if (!best) return;
        const pack = best.pack.length > 1 ? best.pack : near;
        const seen = new Set<string>();
        const ids: string[] = [];
        for (const w of pack) {
          if (seen.has(w.id)) continue;
          seen.add(w.id);
          ids.push(w.id);
        }
        if (ids.length > 1 && onClusterRef.current) onClusterRef.current(ids);
        else onOpenRef.current(ids[0] ?? best.w.id);
      };
      map.on("move zoom viewreset resize", onMove);
      map.on("click", onClick);
      const kickPins = () => {
        pinCache.clear();
        redraw();
      };
      onPinLoad = kickPins;
      if (pinImg?.complete && pinImg.naturalWidth) kickPins();
      else pinImg?.addEventListener("load", kickPins);
      setReady(true);
      requestAnimationFrame(redraw);
      window.setTimeout(() => {
        if (cancelled || !map) return;
        map.invalidateSize({ animate: false });
        redraw();
        dropVeil();
      }, 500);
    };

    const maybeStart = () => {
      if (cancelled || mapRef.current) return;
      const el = host.current;
      if (!visibleRef.current || !el || el.clientWidth < 8 || el.clientHeight < 8) {
        idle = window.setTimeout(maybeStart, 80);
        return;
      }
      void start();
    };
    idle = window.setTimeout(maybeStart, 40);

    return () => {
      cancelled = true;
      window.clearTimeout(idle);
      ro?.disconnect();
      if (onPinLoad) pinImg?.removeEventListener("load", onPinLoad);
      if (map && onMove) map.off("move zoom viewreset resize", onMove);
      if (map && onClick) map.off("click", onClick);
      map?.remove();
      mapRef.current = null;
      window.__atlasMap = undefined;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const fade = window.setTimeout(() => setVeilOut(true), 420);
    const hide = window.setTimeout(() => setHideVeil(true), 720);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !visible) return;
    const t = window.setTimeout(() => {
      mapRef.current?.invalidateSize({ animate: false });
      redraw();
    }, 40);
    return () => window.clearTimeout(t);
  }, [ready, visible]);

  const filterOnce = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (filter === "location") return;
    if (!filterOnce.current) {
      filterOnce.current = true;
      return;
    }
    resetView();
  }, [filter, ready]);

  useEffect(() => {
    host.current?.classList.toggle("is-dark", mapDark);
  }, [mapDark, ready]);

  useEffect(() => {
    if (!ready) return;
    const favSet = new Set(favs);
    favRef.current = favSet;
    listRef.current = WATERS.filter((w) => {
      if (!matchesFilter(w, filter, favSet)) return false;
      if (mapSpecies.length && !mapSpecies.every((id) => w.species.includes(id))) return false;
      if (mapNight && !w.night) return false;
      if (mapBoats && !w.boats) return false;
      return true;
    });
    redraw();
    const live = mapRef.current;
    if (live) {
      window.requestAnimationFrame(() => {
        live.invalidateSize({ animate: false });
        redraw();
      });
    }
  }, [filter, favs, ready, mapNonce, catalogReady, mapSpecies, mapNight, mapBoats]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let disposed = false;
    (async () => {
      const pack = await leafletReady;
      if (!pack || disposed) return;
      const L = pack[0].default;
      if (hereRef.current) {
        map.removeLayer(hereRef.current);
        hereRef.current = null;
      }
      if (!geo) return;
      const icon = L.divIcon({
        className: "fish-marker",
        html: `<div style="position:relative;width:18px;height:18px">
          <div class="here-ring" style="position:absolute;inset:-10px;border-radius:999px;border:2px solid #22c55e"></div>
          <div style="width:14px;height:14px;margin:2px;border-radius:999px;background:#22c55e;border:2px solid white;box-shadow:0 0 0 1px #14532d55"></div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      hereRef.current = L.marker([geo.lat, geo.lng], {
        icon,
        zIndexOffset: 800,
        interactive: false,
      }).addTo(map);
      if (useAtlas.getState().filter === "location") {
        flyToUser(geo.lat, geo.lng);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [geo, ready]);

  return (
    <>
      <div ref={host} className="fishing-map" />
      <canvas ref={canvasRef} className="fish-canvas" aria-hidden />
      {!hideVeil && (
        <div className={cn("map-veil", veilOut && "is-out")} aria-hidden={veilOut}>
          <div className="map-veil-note">
            <div className="indet">
              <span />
            </div>
            <p className="text-[11px] font-medium tracking-wide">Ładowanie mapy</p>
          </div>
        </div>
      )}
    </>
  );
}
