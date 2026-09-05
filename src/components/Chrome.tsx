import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CoffeeIcon,
  MapGlyph,
  ListGlyph,
  BadgeGlyph,
  StarGlyph,
  BookGlyph,
  PackGlyph,
  WeatherGlyph,
  SearchGlyph,
} from "@/components/icons";
import {
  CUPLINK,
  FILTER_META,
  formatCoords,
  googlePin,
  INSTAGRAM,
  sanitizeQuery,
  searchWaters,
  DISCLAIMER,
  WATERS_BY_ID,
} from "@/lib/catalog";
import { zoomBy, resetView, flyToSpot, flyToUser } from "@/lib/map-api";
import { useAtlas } from "@/lib/store";
import type { MapFilter, Screen, Water, WeatherNow } from "@/lib/types";
import { weatherIcon } from "@/lib/weather";
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

export function OnlinePill({ n }: { n: number }) {
  return (
    <div className="pointer-events-none absolute top-[max(0.55rem,env(safe-area-inset-top))] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/75 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border backdrop-blur-sm">
      <span className="online-dot" />
      <span>
        Online: <span className="tabular-nums">{n}</span>
      </span>
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
  const setFilter = useAtlas((s) => s.setFilter);
  const openList = useAtlas((s) => s.openList);

  const items: { id: Screen | "map"; label: string; icon: ReactNode; on: boolean; go: () => void }[] = [
    {
      id: "map",
      label: "Mapa",
      icon: <MapGlyph size={18} />,
      on: screen === "map",
      go: () => {
        setFilter("all");
        setScreen("map");
        resetView();
      },
    },
    {
      id: "list",
      label: "Łowiska",
      icon: <ListGlyph size={18} />,
      on: screen === "list",
      go: () => openList("list"),
    },
    {
      id: "pzw",
      label: "PZW",
      icon: <BadgeGlyph size={18} />,
      on: screen === "pzw",
      go: () => openList("pzw"),
    },
    {
      id: "specjalne",
      label: "Specjalne",
      icon: <StarGlyph size={18} />,
      on: screen === "specjalne",
      go: () => openList("specjalne"),
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
      on: screen === "kit" || screen === "species-waters",
      go: () => setScreen("kit"),
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
  placeholder = "Szukaj…",
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
  const hits = useMemo(
    () => (q.trim() ? searchWaters(q, pool).slice(0, 3) : []),
    [q, pool],
  );
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
      {emptyQuery && dropUp && (
        <div
          className={cn(
            "search-panel rounded-2xl px-4 py-3 text-sm ring-1 shadow-lg",
            "search-hits-kb",
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
  const setOpen = useAtlas((s) => s.setMapSearchOpen);
  const setScreen = useAtlas((s) => s.setScreen);
  return (
    <div className="relative z-30 w-full">
      <SearchField
        value={q}
        onChange={(v) => {
          setQ(v);
          setOpen(v.length > 0);
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
          if (id === "all") resetView();
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

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className={cn("fold", more && "is-open")}>
        <div className="fold-inner" {...(!more ? { inert: true } : {})}>
          <div className="grid grid-cols-3 gap-1.5 pb-1.5 min-[420px]:grid-cols-4">
            {MORE_FILTERS.map((id) => (
              <Chip key={id} id={id} label={FILTER_META[id].label} color={FILTER_META[id].color} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 min-[360px]:grid-cols-4">
        <Chip id="location" label="Lokalizacja" color={FILTER_META.location.color} />
        <Chip id="all" label="Wszystkie" color={FILTER_META.all.color} />
        <Chip id="specjalne" label="Specjalne" color={FILTER_META.specjalne.color} />
        <button
          type="button"
          onClick={toggleMore}
          className="filter-chip min-h-10 w-full rounded-full bg-card-2 px-1.5 text-xs font-semibold leading-tight text-foreground ring-1 ring-border"
        >
          {more ? "Mniej" : "Więcej"}
        </button>
      </div>
    </div>
  );
}

export function RightMenu({ weather }: { weather: WeatherNow | null }) {
  const setScreen = useAtlas((s) => s.setScreen);
  const satellite = useAtlas((s) => s.satellite);
  const toggleSatellite = useAtlas((s) => s.toggleSatellite);
  const setOfflineOpen = useAtlas((s) => s.setOfflineOpen);
  const startBoot = useAtlas((s) => s.startBoot);
  const filter = useAtlas((s) => s.filter);
  const trend = weather?.pressureTrend ?? "flat";
  const scoreTone =
    !weather ? "wait" : weather.weatherCode >= 80 ? "bad" : weather.weatherCode >= 3 || weather.precipitation > 1 ? "mid" : "good";
  const icon = weather ? weatherIcon(weather.weatherCode) : "partly";

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
      <Btn
        label="Pogoda"
        className={cn(
          "map-btn-weather relative",
          scoreTone === "good" ? "is-good" : scoreTone === "mid" ? "is-mid" : scoreTone === "bad" ? "is-bad" : "is-wait",
        )}
        onClick={() => setScreen("weather")}
      >
        <span className="absolute -left-0.5 text-xs font-bold">
          {trend === "down" ? "↓" : trend === "up" ? "↑" : "–"}
        </span>
        <WeatherGlyph kind={icon} size={16} />
      </Btn>
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
      <Btn label="Warstwa mapy" className={satellite ? "is-on" : ""} onClick={toggleSatellite}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M3 13.5 12 18l9-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </Btn>
      <Btn label="Mapa offline" onClick={() => setOfflineOpen(true)}>
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
      <button
        type="button"
        onClick={() => openExternal(CUPLINK)}
        aria-label="Postaw kawę"
        className="map-btn map-btn-coffee overflow-hidden p-0"
      >
        <img src="/brand/cup.png" alt="" className="size-[58%] object-contain brightness-0 invert" />
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mapy offline</p>
        <button type="button" className="tap grid size-7 place-items-center rounded-full bg-card-2" onClick={() => setOpen(false)} aria-label="Zamknij">
          ×
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Pobierz kafelki województwa (zoom 8–11) plus okolice łowisk. Najlepiej przez Wi‑Fi.
      </p>
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
            setMsg("Gotowe — mapa zapisana na tym urządzeniu.");
          } catch {
            setMsg("Błąd — spróbuj na Wi‑Fi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy && pct != null ? `Pobieranie ${pct}%` : "Pobierz mapę"}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-muted">{msg}</p>}
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
    <div className="banner-in rounded-2xl bg-card/95 p-3 text-xs leading-relaxed text-muted ring-1 ring-border backdrop-blur-sm">
      <p>
        Zgoda na zapis w przeglądarce (dziennik, ulubione, mapa offline) oraz na lokalizację do
        odległości. Bez reklam. Szczegóły:{" "}
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
        .
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="tap min-h-10 flex-1 rounded-full bg-primary font-semibold text-primary-foreground"
          onClick={() => setConsent({ cookies: true, geo: true, at: new Date().toISOString() })}
        >
          Zgadzam się
        </button>
        <button
          type="button"
          className="tap min-h-10 flex-1 rounded-full bg-card-2 font-semibold text-foreground ring-1 ring-border"
          onClick={() => setConsent({ cookies: true, geo: false, at: new Date().toISOString() })}
        >
          Tylko niezbędne
        </button>
      </div>
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

export function DisclaimerLine() {
  return <p className="text-xs leading-relaxed text-faint">{DISCLAIMER}</p>;
}
