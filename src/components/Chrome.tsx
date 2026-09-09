import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  MapGlyph,
  ListGlyph,
  BookGlyph,
  PackGlyph,
  WeatherGlyph,
  PressureGlyph,
  SearchGlyph,
  CoffeeIcon,
  FishOutline,
  PermitGlyph,
} from "@/components/icons";
import {
  CUPLINK,
  FILTER_META,
  formatCoords,
  formatProtect,
  googlePin,
  INSTAGRAM,
  MAP_SPECIES,
  nearestTo,
  paperLabel,
  paperOptions,
  protectHint,
  sanitizeQuery,
  searchWaters,
  SPECIES,
  SPECIES_BY_ID,
  speciesName,
  closedEndingDays,
  WATERS_BY_ID,
} from "@/lib/catalog";
import { zoomBy, resetView, flyToSpot, flyToUser } from "@/lib/map-api";
import { useAtlas } from "@/lib/store";
import { OFFLINE_COPY } from "@/lib/content";
import { loadPackInfo } from "@/lib/offline";
import type { MapFilter, Screen, Water, WeatherNow } from "@/lib/types";
import { weatherIcon, windArrow, pressureTrendLabel, windFromLabel } from "@/lib/weather";
import { requestHeadingPermission, useCompassHeading, useSmoothAngle } from "@/lib/heading";
import { cn, copyText, openExternal, splitPhoneParts, telHref, formatPlPhone } from "@/lib/utils";
import { Meter, useFlash } from "@/components/States";

const MORE_FILTERS: MapFilter[] = [
  "pzw",
  "jezioro",
  "prywatne",
  "zalew",
  "staw",
  "rzeka",
  "kanal",
  "morze",
  "komercyjne",
  "ulubione",
];

export function requestLocation(opts?: { reveal?: boolean }) {
  const { geo, setGeo, setGeoDenied, showMyLocation } = useAtlas.getState();
  if (opts?.reveal) {
    showMyLocation();
    if (geo) flyToUser(geo.lat, geo.lng);
  }
  if (!navigator.geolocation) {
    setGeoDenied(true);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (p) => {
      const lat = p.coords.latitude;
      const lng = p.coords.longitude;
      setGeo({ lat, lng });
      if (opts?.reveal) {
        showMyLocation();
        flyToUser(lat, lng);
      }
    },
    () => {
      setGeoDenied(true);
    },
    { enableHighAccuracy: true, timeout: 8000 },
  );
}

function locateOnMap() {
  requestLocation({ reveal: true });
}

function MapCompass({ windDir, windKmh }: { windDir: number; windKmh: number }) {
  const setScreen = useAtlas((s) => s.setScreen);
  const { heading, live } = useCompassHeading();
  const rose = useSmoothAngle(-heading);
  const from = windFromLabel(windDir);
  return (
    <button
      type="button"
      onClick={() => {
        if (!live && typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function") {
          void requestHeadingPermission();
          return;
        }
        setScreen("weather");
      }}
      className={cn("map-compass pointer-events-auto tap ring-1 ring-border backdrop-blur-sm", !live && "is-wait")}
      aria-label={`Kompas. Północ, wschód, południe, zachód. Wiatr z ${from}, ${Math.round(windKmh)} kilometrów na godzinę${live ? "" : ". Dotknij, aby włączyć orientację telefonu"}`}
      title="N północ · E wschód · S południe · W zachód"
    >
      <svg viewBox="0 0 80 80" width="52" height="52" aria-hidden>
        <circle cx="40" cy="40" r="37.5" className="map-compass-ring" />
        <path d="M40 3.5 43.2 9.2 40 7.6 36.8 9.2Z" className="map-compass-notch" />
        <g className="map-compass-rose" style={{ transform: `rotate(${rose}deg)`, transformOrigin: "40px 40px" }}>
          <path d="M40 12v6M40 62v6M12 40h6M62 40h6" className="map-compass-tick" />
          <path d="M18.8 18.8l3.6 3.6M57.6 18.8l-3.6 3.6M18.8 61.2l3.6-3.6M57.6 61.2l-3.6-3.6" className="map-compass-tick-sm" />
          <text x="40" y="16" className="map-compass-n" textAnchor="middle">
            N
          </text>
          <text x="66" y="43.2" className="map-compass-letter" textAnchor="middle">
            E
          </text>
          <text x="40" y="70" className="map-compass-letter" textAnchor="middle">
            S
          </text>
          <text x="14" y="43.2" className="map-compass-letter" textAnchor="middle">
            W
          </text>
          <g className="map-compass-wind" style={{ transform: `rotate(${windDir}deg)`, transformOrigin: "40px 40px" }}>
            <g className="compass-wind-nudge">
              <path d="M40 18 45.6 44 40 39.2 34.4 44Z" />
              <path d="M40 39v16" />
            </g>
          </g>
        </g>
      </svg>
    </button>
  );
}

export function OnlinePill({
  n,
  weather,
}: {
  n: number;
  weather: WeatherNow | null;
}) {
  const setScreen = useAtlas((s) => s.setScreen);
  return (
    <div className="pointer-events-none absolute top-[max(0.55rem,env(safe-area-inset-top))] left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 rounded-full bg-background/75 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border backdrop-blur-sm">
        <span className="online-dot" />
        <span>
          Online: <span className="tabular-nums">{n}</span>
        </span>
      </div>
      {weather && (
        <>
          <button
            type="button"
            onClick={() => setScreen("weather")}
            className="pointer-events-auto tap flex min-h-8 items-center gap-1.5 rounded-full bg-background/75 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border backdrop-blur-sm"
            aria-label={`Wiatr z ${windFromLabel(weather.windDir)} ${Math.round(weather.wind)} kilometrów na godzinę`}
          >
            <span aria-hidden>{windArrow(weather.windDir)}</span>
            <span className="tabular-nums">{Math.round(weather.wind)} km/h</span>
          </button>
          <MapCompass windDir={weather.windDir} windKmh={weather.wind} />
        </>
      )}
    </div>
  );
}

export function FishFab() {
  const setFilter = useAtlas((s) => s.setFilter);
  const setScreen = useAtlas((s) => s.setScreen);
  return (
    <button
      type="button"
      onClick={() => {
        setFilter("all");
        setScreen("map");
        resetView();
      }}
      className="fish-mark absolute top-[max(0.85rem,env(safe-area-inset-top))] left-3 z-20 size-12 overflow-hidden rounded-full ring-1 ring-white/20"
      aria-label="Mapa województwa"
    >
      <img
        src="/brand/fish-logo.png"
        alt=""
        className="fish-swim size-full object-cover"
      />
    </button>
  );
}

export function DownMenu() {
  const screen = useAtlas((s) => s.screen);
  const setScreen = useAtlas((s) => s.setScreen);
  const setKitTab = useAtlas((s) => s.setKitTab);
  const openList = useAtlas((s) => s.openList);
  const hostFrom = useAtlas((s) => s.hostFrom);
  const fromPermits = screen === "host-waters" && hostFrom === "pozwolenia";
  const fromKit = screen === "host-waters" && hostFrom === "kit";

  const items: { id: Screen | "map"; label: string; icon: ReactNode; on: boolean; go: () => void }[] = [
    {
      id: "map",
      label: "Mapa",
      icon: <MapGlyph size={18} />,
      on: screen === "map",
      go: () => {
        setScreen("map");
      },
    },
    {
      id: "list",
      label: "Łowiska",
      icon: <ListGlyph size={18} />,
      on:
        screen === "list" ||
        screen === "compare" ||
        screen === "specjalne" ||
        screen === "pzw" ||
        (screen === "host-waters" && !fromPermits && !fromKit),
      go: () => openList("list"),
    },
    {
      id: "ryby",
      label: "Ryby",
      icon: <FishOutline size={18} />,
      on: screen === "ryby" || screen === "species-waters",
      go: () => setScreen("ryby"),
    },
    {
      id: "pozwolenia",
      label: "Pozwolenia",
      icon: <PermitGlyph size={18} />,
      on: screen === "pozwolenia" || fromPermits,
      go: () => setScreen("pozwolenia"),
    },
    {
      id: "journal",
      label: "Dziennik",
      icon: <BookGlyph size={18} />,
      on: screen === "journal",
      go: () => setScreen("journal"),
    },
    {
      id: "kit",
      label: "Niezbędnik",
      icon: <PackGlyph size={18} />,
      on: screen === "kit" || fromKit,
      go: () => setKitTab("kawa"),
    },
  ];

  const active = items.findIndex((it) => it.on);

  return (
    <nav
      className="down-menu"
      aria-label="Menu"
      style={{ ["--nav-i" as string]: String(Math.max(0, active)) }}
    >
      <span className="down-indicator" style={{ opacity: active < 0 ? 0 : 1 }} aria-hidden />
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={it.go}
          className={cn(
            "down-item flex min-h-11 flex-col items-center justify-center gap-0.5 font-medium",
            it.on ? "is-on text-primary" : "text-muted",
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </nav>
  );
}

export function SearchField({
  value,
  onChange,
  onPick,
  dark,
  placeholder = "Szukaj nazwy, gminy, nr koła…",
  autoFocus,
  dropUp,
  pool,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (id: string) => void;
  dark?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  dropUp?: boolean;
  pool?: Water[];
}) {
  const ref = useRef<HTMLInputElement>(null);
  const q = sanitizeQuery(value);
  const catalogReady = useAtlas((s) => s.catalogReady);
  const hits = useMemo(() => {
    if (!catalogReady || !q.trim()) return [];
    return searchWaters(q, pool).slice(0, 3);
  }, [q, pool, catalogReady]);
  const emptyQuery = q.trim().length >= 2 && hits.length === 0;

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div
      className="relative"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-faint">
        <SearchGlyph size={16} />
      </span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(sanitizeQuery(e.target.value))}
        placeholder={placeholder}
        inputMode="search"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        suppressHydrationWarning
        className={cn(
          "w-full rounded-full bg-white shadow-[0_1px_2px_#3c40434d] ring-1 ring-black/5 outline-none",
          dark ? "search-input-dark bg-card-2 text-foreground ring-border" : "search-input",
          value ? "pr-11" : "",
        )}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Wyczyść"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
          className={cn(
            "absolute top-1/2 right-1.5 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full text-lg leading-none",
            dark ? "text-muted" : "text-neutral-500",
          )}
        >
          ×
        </button>
      )}
      {hits.length > 0 && (
        <ul
          className={cn(
            "search-panel overflow-hidden rounded-2xl ring-1 shadow-lg",
            dropUp
              ? "search-hits-kb"
              : "absolute top-[calc(100%+6px)] right-0 left-0 z-40",
            dark ? "bg-card ring-border" : "bg-white ring-black/10",
          )}
        >
          {hits.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col items-start px-4 py-2.5 text-left",
                  dark ? "hover:bg-card-2" : "hover:bg-neutral-100",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(w.id);
                  onChange("");
                }}
              >
                <span className={cn("text-sm font-medium", dark ? "text-foreground" : "text-neutral-900")}>{w.name}</span>
                <span className={cn("text-xs", dark ? "text-muted" : "text-neutral-500")}>{w.powiat}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {emptyQuery && (
        <div
          className={cn(
            "search-panel rounded-2xl px-4 py-3 text-sm ring-1 shadow-lg",
            dropUp ? "search-hits-kb" : "absolute top-[calc(100%+6px)] right-0 left-0 z-40",
            dark ? "bg-card text-muted ring-border" : "bg-white text-neutral-500 ring-black/10",
          )}
        >
          Brak wyników dla „{q.trim()}”
        </div>
      )}
    </div>
  );
}

export function MapSearch() {
  const q = useAtlas((s) => s.mapQuery);
  const setQ = useAtlas((s) => s.setMapQuery);
  const openSpot = useAtlas((s) => s.openSpot);
  const setScreen = useAtlas((s) => s.setScreen);
  return (
    <div className="relative z-30 w-full">
      <SearchField
        value={q}
        onChange={(v) => {
          setQ(v);
        }}
        onPick={(id) => {
          const w = WATERS_BY_ID[id];
          if (w) flyToSpot(w.lat, w.lng);
          setScreen("map");
          openSpot(id, "map");
        }}
        autoFocus={false}
        dropUp
      />
    </div>
  );
}

export function FilterBar() {
  const filter = useAtlas((s) => s.filter);
  const setFilter = useAtlas((s) => s.setFilter);
  const more = useAtlas((s) => s.moreOpen);
  const toggleMore = useAtlas((s) => s.toggleMore);
  const mapSpecies = useAtlas((s) => s.mapSpecies);
  const setMapSpecies = useAtlas((s) => s.setMapSpecies);
  const mapNight = useAtlas((s) => s.mapNight);
  const setMapNight = useAtlas((s) => s.setMapNight);
  const mapBoats = useAtlas((s) => s.mapBoats);
  const setMapBoats = useAtlas((s) => s.setMapBoats);

  const Chip = ({
    id,
    label,
    color,
  }: {
    id: MapFilter;
    label: string;
    color: string;
  }) => {
    const on = filter === id;
    return (
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (id === "location") {
            locateOnMap();
            return;
          }
          setFilter(id);
          resetView();
        }}
        className={cn(
          "filter-chip min-h-10 w-full rounded-full px-1 text-xs font-semibold leading-tight text-white ring-1 sm:px-2",
          on ? "ring-white" : "ring-black/30",
        )}
        style={{ background: color }}
      >
        {label}
      </button>
    );
  };

  const ending = SPECIES.map((s) => ({ s, d: closedEndingDays(s) })).filter(
    (x) => x.d != null && x.d <= 3,
  );

  return (
    <div className="flex w-full flex-col gap-1.5">
      {ending.length > 0 && (
        <p className="rounded-xl bg-card/90 px-2.5 py-1.5 text-[11px] leading-snug text-foreground ring-1 ring-border">
          {ending
            .map(({ s, d }) =>
              d === 0 ? `${s.name}: ochrona kończy się dziś` : `${s.name}: ochrona jeszcze ${d} dni`,
            )
            .join(" · ")}
        </p>
      )}
      <div className={cn("fold", more && "is-open")}>
        <div className="fold-inner" {...(!more ? { inert: true } : {})}>
          <div className="grid grid-cols-3 gap-1.5 pb-1.5 min-[420px]:grid-cols-4">
            {MORE_FILTERS.map((id) => (
              <Chip key={id} id={id} label={FILTER_META[id].label} color={FILTER_META[id].color} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 pb-1.5 min-[420px]:grid-cols-4">
            {MAP_SPECIES.map((id) => {
              const sp = SPECIES_BY_ID[id];
              const on = mapSpecies.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapSpecies(id);
                  }}
                  className={cn(
                    "filter-chip min-h-10 w-full rounded-full px-1 text-xs font-semibold leading-tight ring-1 sm:px-2",
                    on
                      ? "bg-card-2 text-foreground ring-white"
                      : "bg-card-2 text-foreground ring-border",
                  )}
                >
                  {sp?.name ?? id}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Chip id="location" label="Lokalizacja" color={FILTER_META.location.color} />
        <Chip id="all" label="Wszystkie" color={FILTER_META.all.color} />
        <Chip id="specjalne" label="Specjalne" color={FILTER_META.specjalne.color} />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setMapNight();
          }}
          className={cn(
            "filter-chip min-h-10 w-full rounded-full px-1 text-xs font-semibold leading-tight ring-1 sm:px-2",
            mapNight
              ? "bg-card-2 text-foreground ring-white"
              : "bg-card-2 text-foreground ring-border",
          )}
        >
          Noc
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setMapBoats();
          }}
          className={cn(
            "filter-chip min-h-10 w-full rounded-full px-1 text-xs font-semibold leading-tight ring-1 sm:px-2",
            mapBoats
              ? "bg-card-2 text-foreground ring-white"
              : "bg-card-2 text-foreground ring-border",
          )}
        >
          Łodzie
        </button>
        <button
          type="button"
          onClick={toggleMore}
          className="filter-chip min-h-10 w-full rounded-full bg-card-2 px-1.5 text-xs font-semibold leading-tight text-foreground ring-1 ring-border"
        >
          {more ? "Mniej" : "Więcej"}
        </button>
      </div>
      {(filter !== "all" || mapSpecies.length > 0 || mapNight || mapBoats) && (
        <div className="flex flex-wrap gap-1">
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="tap min-h-7 rounded-full bg-card px-2.5 text-[11px] font-semibold ring-1 ring-border"
            >
              {FILTER_META[filter].label} ×
            </button>
          )}
          {mapSpecies.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMapSpecies(id)}
              className="tap min-h-7 rounded-full bg-card px-2.5 text-[11px] font-semibold ring-1 ring-border"
            >
              {SPECIES_BY_ID[id]?.name ?? id} ×
            </button>
          ))}
          {mapNight && (
            <button
              type="button"
              onClick={setMapNight}
              className="tap min-h-7 rounded-full bg-card px-2.5 text-[11px] font-semibold ring-1 ring-border"
            >
              Noc ×
            </button>
          )}
          {mapBoats && (
            <button
              type="button"
              onClick={setMapBoats}
              className="tap min-h-7 rounded-full bg-card px-2.5 text-[11px] font-semibold ring-1 ring-border"
            >
              Łodzie ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PaperPicker() {
  const papers = useAtlas((s) => s.papers);
  const toggle = useAtlas((s) => s.togglePaper);
  useAtlas((s) => s.catalogReady);
  const options = paperOptions();
  return (
    <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Moje zezwolenie</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Odhacz twoje zezwolenie. Przycisk najbliższych na mapie pokaże tylko te wody.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((p) => {
          const on = papers.includes(p.key);
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => toggle(p.key)}
              aria-pressed={on}
              className={cn(
                "tap min-h-10 rounded-full px-3 text-xs font-semibold ring-1",
                on
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card-2 text-foreground ring-border",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {papers.length > 0 ? (
        <p className="mt-2 text-[11px] text-muted">
          Aktywne: {papers.map(paperLabel).join(" · ")}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-faint">Bez sita — najbliższe to wszystkie wody wokół ciebie.</p>
      )}
    </section>
  );
}

export function RightMenu({ weather }: { weather: WeatherNow | null }) {
  const setScreen = useAtlas((s) => s.setScreen);
  const setOfflineOpen = useAtlas((s) => s.setOfflineOpen);
  const mapDark = useAtlas((s) => s.mapDark);
  const toggleMapDark = useAtlas((s) => s.toggleMapDark);
  const startBoot = useAtlas((s) => s.startBoot);
  const [packed, setPacked] = useState(() => Boolean(loadPackInfo()));
  useEffect(() => {
    const sync = () => setPacked(Boolean(loadPackInfo()));
    window.addEventListener("atlas-offline-pack", sync);
    return () => window.removeEventListener("atlas-offline-pack", sync);
  }, []);
  const filter = useAtlas((s) => s.filter);
  const sheet = useAtlas((s) => s.sheet);
  const papers = useAtlas((s) => s.papers);
  const sheetOn = sheet?.kind === "nearby";
  const trend = weather?.pressureTrend ?? "flat";
  const scoreTone =
    !weather ? "wait" : weather.weatherCode >= 80 ? "bad" : weather.weatherCode >= 3 || weather.precipitation > 1 ? "mid" : "good";
  const icon = weather ? weatherIcon(weather.weatherCode) : "partly";

  const showNearby = () => {
    const st = useAtlas.getState();
    if (!st.geo) {
      st.setNearbyPending(true);
      locateOnMap();
      return;
    }
    if (!st.catalogReady) {
      st.setNearbyPending(true);
      return;
    }
    const papers = st.papers;
    const ids = nearestTo(st.geo.lat, st.geo.lng, papers.length ? 8 : 5, papers).map((w) => w.id);
    st.openSheet({
      kind: "nearby",
      title: papers.length ? "Najbliższe · twoje zezwolenie" : "Najbliższe",
      ids,
    });
  };

  const Btn = ({
    children,
    onClick,
    className,
    label,
  }: {
    children: ReactNode;
    onClick: () => void;
    className?: string;
    label: string;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn("map-btn", className)}
    >
      {children}
    </button>
  );

  return (
    <div className="map-right-col">
      <div className="map-right-tools">
      <div className="map-weather-row">
        <Btn
          label={
            !weather
              ? "Ciśnienie"
              : trend === "down"
                ? "Ciśnienie spada"
                : trend === "up"
                  ? "Ciśnienie rośnie"
                  : "Ciśnienie stabilne"
          }
          className={cn(
            "map-btn-pressure pressure-mark",
            !weather ? "is-wait" : trend === "down" ? "is-down" : trend === "up" ? "is-up" : "is-flat",
          )}
          onClick={() => setScreen("weather")}
        >
          <PressureGlyph trend={weather ? trend : "flat"} size={18} />
        </Btn>
        <Btn
          label={
            !weather
              ? "Pogoda"
              : `Pogoda, ciśnienie ${pressureTrendLabel(trend)}`
          }
          className={cn(
            "map-btn-weather",
            scoreTone === "good" ? "is-good" : scoreTone === "mid" ? "is-mid" : scoreTone === "bad" ? "is-bad" : "is-wait",
          )}
          onClick={() => setScreen("weather")}
        >
          <WeatherGlyph kind={icon} size={18} />
        </Btn>
      </div>
      <Btn label="Jak dodać do ekranu" onClick={() => setScreen("install")}>
        <span className="text-sm font-semibold">i</span>
      </Btn>
      <Btn label="Powiększ" onClick={() => zoomBy(1)}>
        <span className="text-xl leading-none">+</span>
      </Btn>
      <Btn label="Pomniejsz" onClick={() => zoomBy(-1)}>
        <span className="text-xl leading-none">−</span>
      </Btn>
      <Btn label="Moja lokalizacja" className={filter === "location" ? "is-on" : ""} onClick={locateOnMap}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Btn>
      <Btn
        label={papers.length ? "Najbliższe z twoim zezwoleniem" : "Najbliższe łowiska"}
        className={sheetOn ? "is-on" : ""}
        onClick={showNearby}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <path d="M12 5v2M12 17v2M5 12h2M17 12h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </Btn>
      <Btn label="Ciemna mapa" className={mapDark ? "is-on" : ""} onClick={toggleMapDark}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3a9 9 0 1 0 9 9c0-.5-.04-1-.12-1.48A7 7 0 0 1 12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </Btn>
      <Btn label="Mapa offline" className={packed ? "is-on" : ""} onClick={() => setOfflineOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 4v10M8 10l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 18h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </Btn>
      <Btn label="Odśwież" onClick={startBoot}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 12a8 8 0 1 1-2.2-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M20 5v5h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Btn>
      <button
        type="button"
        onClick={() => openExternal(INSTAGRAM)}
        aria-label="Instagram"
        className="map-btn overflow-hidden rounded-full p-0"
      >
        <img src="/brand/logo-karp-circle.png" alt="" className="size-full rounded-full object-cover" />
      </button>
      </div>
      <button
        type="button"
        onClick={() => openExternal(CUPLINK)}
        aria-label="Postaw kawę"
        className="map-btn map-btn-coffee"
      >
        <CoffeeIcon size={18} />
      </button>
    </div>
  );
}

export function CoordsBanner() {
  const geo = useAtlas((s) => s.geo);
  const show = useAtlas((s) => s.showCoords);
  const denied = useAtlas((s) => s.geoDenied);
  const setShow = useAtlas((s) => s.setShowCoords);
  const [copiedCoords, flashCoords] = useFlash(1400);
  const [copiedPin, flashPin] = useFlash(1400);
  if (!show) return null;
  const text = geo ? formatCoords(geo.lat, geo.lng) : denied ? "Brak uprawnień do lokalizacji" : "Brak lokalizacji";
  const copy = async () => {
    if (!geo) return;
    if (await copyText(formatCoords(geo.lat, geo.lng))) flashCoords();
  };
  const share = async () => {
    if (!geo) return;
    const url = googlePin(geo.lat, geo.lng);
    const payload = `Lokalizacja\n${formatCoords(geo.lat, geo.lng)}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Lokalizacja", text: payload, url });
        return;
      }
    } catch {
      /* cancel */
    }
    if (await copyText(payload)) flashPin();
    else window.open(url, "_blank", "noreferrer");
  };
  return (
    <div className="banner-in flex items-center gap-2 rounded-2xl bg-card/90 px-2 py-2 text-xs ring-1 ring-border backdrop-blur-sm">
      <button
        type="button"
        onClick={copy}
        disabled={!geo}
        aria-label="Kopiuj współrzędne"
        className="tap min-h-9 min-w-0 flex-1 truncate rounded-full bg-card-2 px-3 py-1.5 text-left font-medium tabular-nums text-foreground disabled:opacity-40"
      >
        {copiedCoords ? "Skopiowano" : text}
      </button>
      <button
        type="button"
        onClick={share}
        disabled={!geo}
        aria-label="Kopiuj pinezkę mapy"
        className="tap min-h-9 shrink-0 rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground disabled:opacity-40"
      >
        {copiedPin ? "Skopiowano" : "Pinezka"}
      </button>
      <button type="button" onClick={() => setShow(false)} className="tap grid size-9 shrink-0 place-items-center rounded-full bg-card-2" aria-label="Zamknij">
        ×
      </button>
    </div>
  );
}

export function OfflineReady() {
  const [on, setOn] = useState(() => Boolean(loadPackInfo()));
  useEffect(() => {
    const sync = () => setOn(Boolean(loadPackInfo()));
    window.addEventListener("atlas-offline-pack", sync);
    return () => window.removeEventListener("atlas-offline-pack", sync);
  }, []);
  if (!on) return null;
  return (
    <p className="banner-in rounded-full bg-card/95 px-3 py-1.5 text-center text-[11px] font-semibold text-ok ring-1 ring-border">
      Katalog zapisany
    </p>
  );
}

export function OfflinePanel() {
  const open = useAtlas((s) => s.offlineOpen);
  const setOpen = useAtlas((s) => s.setOfflineOpen);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <div className="banner-in rounded-2xl bg-card/95 p-3 text-sm ring-1 ring-border backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Offline</p>
        <button type="button" className="tap grid size-7 place-items-center rounded-full bg-card-2" onClick={() => setOpen(false)} aria-label="Zamknij">
          ×
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{OFFLINE_COPY.panel}</p>
      {loadPackInfo() && !busy && (
        <p className="mt-2 text-xs font-semibold text-ok">Katalog zapisany — możesz jechać bez sieci.</p>
      )}
      {pct != null && pct < 100 && (
        <div className="mt-3">
          <Meter value={pct} label="Postęp pobierania" />
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        className="tap mt-3 min-h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70"
        onClick={async () => {
          const { downloadOffline } = await import("@/lib/offline");
          setBusy(true);
          setPct(0);
          setMsg(null);
          try {
            await downloadOffline((d, t) => setPct(Math.round((d / t) * 100)));
            setPct(100);
            setMsg("Gotowe — mapa i katalog zapisane na tym urządzeniu.");
          } catch {
            setMsg("Błąd — spróbuj na Wi‑Fi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy && pct != null ? `Pobieranie ${pct}%` : "Pobierz mapę i katalog"}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-muted">{msg}</p>}
    </div>
  );
}

export function CoffeeAsk() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem("atlas.coffeeAsk") !== "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(t);
  }, []);
  if (!ready || !open) return null;
  const dismiss = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("atlas.coffeeAsk", "1");
    } catch {
      /* ignore */
    }
  };
  return (
    <div
      className="banner-in flex items-center gap-2 rounded-2xl bg-card/95 px-3 py-2 ring-1 ring-border backdrop-blur-sm"
      role="status"
    >
      <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-foreground">
        Podoba Ci się Atlas? Postaw kawę.
      </p>
      <button
        type="button"
        className="tap inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full bg-coffee px-3 text-xs font-semibold text-coffee-fg"
        onClick={() => {
          openExternal(CUPLINK);
          dismiss();
        }}
      >
        <CoffeeIcon size={14} />
        Kawę
      </button>
      <button
        type="button"
        className="tap grid size-9 shrink-0 place-items-center rounded-full bg-card-2 text-sm font-semibold text-foreground ring-1 ring-border"
        onClick={dismiss}
        aria-label="Później"
      >
        ×
      </button>
    </div>
  );
}

export function ConsentBanner() {
  const consent = useAtlas((s) => s.consent);
  const setConsent = useAtlas((s) => s.setConsent);
  const setKitTab = useAtlas((s) => s.setKitTab);
  const setScreen = useAtlas((s) => s.setScreen);
  if (consent) return null;
  return (
    <div className="banner-in flex flex-wrap items-center gap-2 rounded-2xl bg-card/95 px-3 py-2 text-[11px] leading-snug text-muted ring-1 ring-border backdrop-blur-sm">
      <p className="min-w-0 flex-1">
        Zapis lokalny i GPS. Bez reklam.{" "}
        <button
          type="button"
          className="font-semibold text-primary underline"
          onClick={() => {
            setScreen("kit");
            setKitTab("ciasteczka");
          }}
        >
          Ciasteczka
        </button>
      </p>
      <button
        type="button"
        className="tap h-9 shrink-0 rounded-full bg-primary px-3 font-semibold text-primary-foreground"
        onClick={() => setConsent({ cookies: true, geo: true, at: new Date().toISOString() })}
      >
        Zgadzam się
      </button>
      <button
        type="button"
        className="tap h-9 shrink-0 rounded-full bg-card-2 px-2.5 font-semibold text-foreground ring-1 ring-border"
        onClick={() => setConsent({ cookies: true, geo: false, at: new Date().toISOString() })}
      >
        Niezbędne
      </button>
    </div>
  );
}

export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Wróć"
      className="tap inline-flex size-10 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15.5 5.5 8.5 12l7 6.5"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function OutLink({
  href,
  children,
  tone = "secondary",
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={() => openExternal(href)}
      className={cn(
        "tap inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-center text-sm font-semibold leading-tight",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-card-2 text-foreground ring-1 ring-border",
      )}
    >
      {children}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 opacity-80">
        <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14 19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 13.5V19H5V7h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function TelBtn({
  number,
  label,
}: {
  number: string;
  label?: string;
}) {
  const pretty = formatPlPhone(number);
  return (
    <a
      href={telHref(number)}
      className="tap inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-center text-sm font-semibold leading-tight text-primary-foreground"
      aria-label={`Zadzwoń ${pretty}`}
    >
      {label ?? `Zadzwoń ${pretty}`}
    </a>
  );
}

/** Turn "Tel. 664 309 001" in any copy into a tappable call link. */
export function PhoneText({ text, className }: { text: string; className?: string }) {
  const parts = splitPhoneParts(text);
  if (parts.every((p) => !p.tel)) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.tel ? (
          <a
            key={i}
            href={p.tel}
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-2"
          >
            {p.t}
          </a>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </span>
  );
}

export function ActionBtn({
  onClick,
  children,
  tone = "secondary",
  disabled,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: "primary" | "secondary";
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "tap inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-center text-sm font-semibold leading-tight tabular-nums disabled:opacity-40",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-card-2 text-foreground ring-1 ring-border",
      )}
    >
      {children}
    </button>
  );
}

export function SpeciesChip({
  id,
  okrag,
  sea,
  protect = true,
}: {
  id: string;
  okrag?: string;
  sea?: boolean;
  protect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const sp = SPECIES_BY_ID[id];
  const name = sp?.name ?? speciesName(id);
  const p = protect && sp ? formatProtect(sp, okrag, sea) : null;
  const hint = protect ? protectHint(id, okrag, sea) : "";

  useEffect(() => {
    if (!open) return;
    const hide = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!protect) {
    return (
      <span className="inline-flex items-center rounded-full bg-card-2 px-2.5 py-1 text-xs font-medium ring-1 ring-border">
        {name}
      </span>
    );
  }

  return (
    <span ref={box} className="relative inline-block">
      <button
        type="button"
        title={hint || undefined}
        aria-expanded={open}
        aria-label={`${name}. ${hint}`}
        onClick={() => {
          const next = !open;
          if (next && box.current) {
            const r = box.current.getBoundingClientRect();
            setFlipX(r.left + 230 > window.innerWidth - 16);
            setFlipY(r.bottom + 190 > window.innerHeight - 16);
          }
          setOpen(next);
        }}
        className="tap inline-flex items-center gap-1 rounded-full bg-card-2 px-2.5 py-1 text-xs font-medium ring-1 ring-border"
      >
        {name}
        <span className="grid size-4 place-items-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
          i
        </span>
      </button>
      {open && p && sp ? (
        <div
          role="dialog"
          className={cn(
            "absolute z-40 w-56 rounded-xl bg-card p-3 text-left shadow-lg ring-1 ring-border",
            flipX ? "right-0 left-auto" : "left-0",
            flipY ? "bottom-[calc(100%+0.35rem)] top-auto" : "top-[calc(100%+0.35rem)]",
          )}
        >
          <p className="text-sm font-semibold text-foreground">{sp.name}</p>
          <p className="text-xs italic text-muted">{sp.latin}</p>
          <p className="mt-2 text-xs text-foreground">
            Wymiar ochronny: <span className="font-semibold tabular-nums">{p.size}</span>
            {p.fork ? " (okręg)" : ""}
          </p>
          <p className="mt-0.5 text-xs text-foreground">
            Limit: <span className="font-semibold">{p.limit}</span>
          </p>
          <p className={cn("mt-0.5 text-xs", p.period.active ? "text-danger" : "text-muted")}>
            {p.period.label}
          </p>
          <p className="mt-2 text-[10px] leading-snug text-faint">
            RAPR PZW i rozporządzenie. Okręg lub gospodarz może zaostrzyć.
          </p>
        </div>
      ) : null}
    </span>
  );
}
