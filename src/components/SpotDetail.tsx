import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  categoryTags,
  CUPLINK,
  DISCLAIMER,
  formatCoords,
  formatDepth,
  formatDistance,
  formatSize,
  googleNav,
  googlePin,
  haversineKm,
  KIND_COLOR,
  linkLabel,
  managerOf,
  METHOD_LABEL,
  nearestWaters,
  obwodLabel,
  waterTitle,
  hostGroupOf,
  watersOfHost,
  isSpecial,
  safeHttpUrl,
  speciesName,
  WATERS_BY_ID,
} from "@/lib/catalog";
import { CoffeeIcon, FishOutline, FishPinSvg, StarGlyph, WeatherGlyph } from "@/components/icons";
import { ActionBtn, BackBtn, OutLink, PhoneText, SpeciesChip, TelBtn } from "@/components/Chrome";
import { fetchWeather, weatherIcon, weatherLabel, windArrow } from "@/lib/weather";
import {
  biomet,
  dayParts,
  feedingLabel,
  feedingScore,
  feedingTone,
  forecastFeeding,
  moonPhase,
} from "@/lib/feeding";
import { useAtlas } from "@/lib/store";
import type { WeatherNow } from "@/lib/types";
import { cn, copyText, openExternal, phonesIn } from "@/lib/utils";
import { EmptyState, FeedSkeleton, ScreenFrame, useFlash } from "@/components/States";
import { fetchHydro, hydroRiverKey, type HydroRow } from "@/lib/hydro";
import { OSM_URL } from "@/lib/tiles";
import { shareWaterCard } from "@/lib/share-card";

function toneClass(tone: "ok" | "primary" | "warn" | "danger") {
  if (tone === "ok") return "bg-ok/15 text-ok";
  if (tone === "primary") return "bg-primary/20 text-primary";
  if (tone === "warn") return "bg-warn/20 text-warn";
  return "bg-danger/15 text-danger";
}

function SpotTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <p className="text-xs font-medium text-faint">{label}</p>
      <p className="mt-1.5 text-base font-semibold leading-tight tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

function MiniMap({
  lat,
  lng,
  full,
  color,
}: {
  lat: number;
  lng: number;
  full: boolean;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: full,
        scrollWheelZoom: full,
      }).setView([lat, lng], full ? 15 : 14);
      L.tileLayer(OSM_URL, { maxZoom: 19 }).addTo(map);
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: "fish-marker",
          html: FishPinSvg({ color, size: 32 }),
          iconSize: [32, 20],
          iconAnchor: [20, 10],
        }),
      }).addTo(map);
      setTimeout(() => {
        map?.invalidateSize();
        if (!cancelled) setOn(true);
      }, 80);
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, full, color]);
  return (
    <>
      {!on && <div className="mini-skel rounded-[inherit]" />}
      <div ref={ref} className={full ? "fishing-map" : "spot-mini-map"} />
    </>
  );
}

export function SpotDetail() {
  const id = useAtlas((s) => s.selectedId);
  const close = useAtlas((s) => s.closeSpot);
  const full = useAtlas((s) => s.spotMapFull);
  const setFull = useAtlas((s) => s.setSpotMapFull);
  const geo = useAtlas((s) => s.geo);
  const favs = useAtlas((s) => s.favorites);
  const toggleFav = useAtlas((s) => s.toggleFav);
  const journal = useAtlas((s) => s.journal);
  const openHost = useAtlas((s) => s.openHost);
  const openCompare = useAtlas((s) => s.openCompare);
  const openSpot = useAtlas((s) => s.openSpot);
  const setScreen = useAtlas((s) => s.setScreen);
  const setListFilter = useAtlas((s) => s.setListFilter);
  const setListObwod = useAtlas((s) => s.setListObwod);
  const w = id ? WATERS_BY_ID[id] : undefined;
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [hydro, setHydro] = useState<HydroRow[] | null>(null);
  const [copiedCoords, flashCoords] = useFlash(1400);
  const [copiedPin, flashPin] = useFlash(1400);
  const [shareFail, flashShareFail] = useFlash(1800);

  useEffect(() => {
    if (!w) return;
    let live = true;
    fetchWeather(w.lat, w.lng).then((d) => {
      if (live) setWeather(d);
    });
    if (hydroRiverKey(w)) {
      fetchHydro(w).then((rows) => {
        if (live) setHydro(rows);
      });
    } else {
      setHydro(null);
    }
    return () => {
      live = false;
    };
  }, [w?.id]);

  if (!w) {
    return (
      <ScreenFrame onBack={close}>
        <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <BackBtn onClick={close} />
          <EmptyState
            icon={<FishOutline size={26} />}
            title="Nie znaleziono łowiska"
            body="Ta karta mogła wygasnąć. Wróć do listy albo mapy i wybierz łowisko jeszcze raz."
            action={close}
            actionLabel="Wróć"
          />
        </div>
      </ScreenFrame>
    );
  }

  const mgr = managerOf(w);
  const host = hostGroupOf(w);
  const hostCount = watersOfHost(host.key).length;
  const dist = geo ? formatDistance(haversineKm(geo.lat, geo.lng, w.lat, w.lng)) : null;
  const on = favs.includes(w.id);
  const web = safeHttpUrl(w.website) ?? safeHttpUrl(mgr.website);
  const social = safeHttpUrl(w.socialUrl) ?? safeHttpUrl(mgr.socialUrl);
  const socialBtn = social && social !== web ? social : null;
  const permit = safeHttpUrl(mgr.permitUrl);
  const price = safeHttpUrl(mgr.priceUrl);
  const phones = phonesIn(w.ticket, w.access, w.parking, w.summary, w.rules, mgr.priceNote);
  const catches = journal.filter((j) => j.waterId === w.id);
  const color = KIND_COLOR[w.kind];
  const score = weather ? feedingScore(weather) : null;
  const moon = moonPhase();
  const bio = weather ? biomet(weather) : null;
  const days = weather ? forecastFeeding(weather) : [];

  const copyCoords = async () => {
    if (await copyText(formatCoords(w.lat, w.lng))) flashCoords();
  };
  const sharePin = async () => {
    const url = googlePin(w.lat, w.lng);
    const payload = `${w.name}\n${formatCoords(w.lat, w.lng)}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: w.name, text: payload, url });
        return;
      }
    } catch {
      /* cancel */
    }
    if (await copyText(payload)) flashPin();
    else window.open(url, "_blank", "noreferrer");
  };

  const Box = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );

  return (
    <ScreenFrame onBack={close}>
      {full && (
        <div className="fixed inset-0 z-[80] bg-background">
          <MiniMap lat={w.lat} lng={w.lng} full color={color} />
          <button
            type="button"
            onClick={() => setFull(false)}
            className="tap absolute top-[max(0.7rem,env(safe-area-inset-top))] right-3 z-[81] grid size-10 place-items-center rounded-full bg-black/70 text-lg text-white"
            aria-label="Zamknij mapę"
          >
            ×
          </button>
        </div>
      )}
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <BackBtn onClick={close} />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight">{w.name}</h1>
              <p className="mt-1 text-xs text-primary">{categoryTags(w).join(" · ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => toggleFav(w.id)} className="star-btn text-warn" aria-label="Ulubione">
              <StarGlyph size={22} filled={on} />
            </button>
            <button
              type="button"
              onClick={() => openExternal(CUPLINK)}
              className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg"
              aria-label="Postaw kawę"
            >
              <CoffeeIcon size={18} />
            </button>
          </div>
        </header>

        <p className="mt-3 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        {w.summary && (
          <p className="mt-3 text-sm leading-relaxed text-foreground">{w.summary}</p>
        )}
        {(w.kind === "komercyjne" || w.noKill || isSpecial(w)) && (
          <div className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
            <p className="text-sm font-semibold">
              {w.noKill ? "No kill — catch & release" : "No kill / zabieranie"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {w.noKill
                ? "Ryba wraca do wody. Mata, podbierak i regulamin gospodarza obowiązują — potwierdź na miejscu."
                : "Na łowiskach komercyjnych i specjalnych często obowiązuje no kill. Zabieranie ryb tylko jeśli regulamin gospodarza na to pozwala."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFull(true)}
          className="relative mt-4 mx-1 block aspect-[16/10] w-[calc(100%-0.5rem)] overflow-hidden rounded-2xl ring-1 ring-border"
        >
          <MiniMap lat={w.lat} lng={w.lng} full={false} color={color} />
          {weather && (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
              {Math.round(weather.pressure)} hPa · {windArrow(weather.windDir)}{" "}
              {Math.round(weather.wind)} km/h
            </span>
          )}
        </button>

        <div className="mt-3 grid gap-2">
          <Box title="Wielkość i głębokość">
            {[
              formatSize(w),
              formatDepth(w)
                ? `głębokość ${formatDepth(w)}`
                : w.kind === "jezioro" || w.kind === "zalew" || w.kind === "staw" || w.kind === "komercyjne"
                  ? "brak pomiaru batymetrycznego"
                  : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Brak danych"}
            {!formatDepth(w) &&
              (w.kind === "jezioro" || w.kind === "zalew") && (
                <p className="mt-1 text-[11px] leading-snug text-faint">
                  NMT GUGiK to model terenu, nie dna jeziora — nie zgadujemy metrów.
                </p>
              )}
          </Box>
          <Box title="Zarządzający">
            <button
              type="button"
              onClick={() => openHost(host.key)}
              className="tap block w-full text-left"
            >
              <p className="font-medium text-primary underline decoration-primary/40 underline-offset-2">
                {mgr.name}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {hostCount} {hostCount === 1 ? "łowisko" : hostCount < 5 ? "łowiska" : "łowisk"} tego gospodarza
              </p>
            </button>
            {mgr.priceNote && (
              <p className="mt-1 text-xs text-muted">
                <PhoneText text={mgr.priceNote} />
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2 min-[380px]:flex-row">
              {web && (
                <OutLink href={web} tone="primary">
                  {linkLabel(web, "host")}
                </OutLink>
              )}
              {socialBtn && (
                <OutLink href={socialBtn} tone={web ? "secondary" : "primary"}>
                  {linkLabel(socialBtn, "social")}
                </OutLink>
              )}
            </div>
            {phones.length > 0 && (
              <div className="mt-2 flex flex-col gap-2 min-[380px]:flex-row">
                {phones.map((n) => (
                  <TelBtn key={n} number={n} />
                ))}
              </div>
            )}
          </Box>
          {w.obwod && w.obwod.length > 0 && (
            <Box title="Koło / obwód PZW">
              <div className="flex flex-wrap gap-1.5">
                {w.obwod.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      setListFilter("all");
                      setListObwod(o);
                      setScreen("list");
                    }}
                    className="tap min-h-9 rounded-full bg-card-2 px-3 text-xs font-semibold tabular-nums ring-1 ring-border"
                  >
                    {obwodLabel(o)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-faint">Numer koła lub obwodu z regulaminu — otwiera listę.</p>
            </Box>
          )}
          <Box title="Zasady i zezwolenia">
            <ul className="space-y-1 text-xs text-muted">
              {(w.rules ?? []).map((r) => (
                <li key={r}>
                  • <PhoneText text={r} />
                </li>
              ))}
            </ul>
            {w.ticket && (
              <p className="mt-2 text-xs">
                <PhoneText text={w.ticket} />
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {permit && (
                <button
                  type="button"
                  onClick={() => openExternal(permit)}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  {mgr.permitLabel ?? "Zezwolenie"}
                </button>
              )}
              {price && (
                <button
                  type="button"
                  onClick={() => openExternal(price)}
                  className="rounded-full bg-card-2 px-3 py-1.5 text-xs font-medium"
                >
                  {mgr.priceLabel ?? "Cennik"}
                </button>
              )}
            </div>
          </Box>
          <Box title="Zapis z dziennika">
            {catches.length === 0 ? (
              <p className="text-xs text-muted">
                Brak zapisanych połowów na tym łowisku. Dodasz je w zakładce Dziennik.
              </p>
            ) : (
              <ul className="space-y-1 text-xs">
                {catches.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    {new Date(c.createdAt).toLocaleDateString("pl-PL")} · {speciesName(c.speciesId)}
                    {c.lengthCm ? ` · ${c.lengthCm} cm` : ""}
                    {c.weightKg ? ` · ${c.weightKg} kg` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Box>
          <Box title="Gatunki">
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(w.species)]
                .slice()
                .sort((a, b) => speciesName(a).localeCompare(speciesName(b), "pl"))
                .map((id) => (
                  <SpeciesChip key={id} id={id} okrag={w.okrag} sea={w.kind === "morze"} />
                ))}
            </div>
          </Box>
          <Box title="Metody">
            {[...w.methods]
              .map((m) => METHOD_LABEL[m] ?? m)
              .sort((a, b) => a.localeCompare(b, "pl"))
              .join(", ")}
            {w.night ? " · noc" : ""}
            {w.boats ? " · łodzie" : ""}
            {w.engines ? ` · silniki: ${w.engines}` : ""}
            {w.noKill ? " · no-kill" : ""}
          </Box>
          <Box title="Odległość">
            <div className="flex items-center justify-between gap-2">
              <span>{dist ?? "Włącz lokalizację, aby zobaczyć odległość."}</span>
              <button
                type="button"
                onClick={() => openExternal(googleNav(w.lat, w.lng))}
                className="tap rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Nawiguj
              </button>
            </div>
          </Box>
          <Box title="Dojazd i parking">
            <p className="text-xs text-muted">
              <PhoneText text={w.access || "Brzeg i dojazd wg mapy."} />
            </p>
            <p className="mt-1 text-xs text-muted">
              Parking: <PhoneText text={w.parking || "Przy drodze / lesie"} />
            </p>
          </Box>
          {hydro && hydro.length > 0 && (
            <Box title="Stan wody IMGW">
              <ul className="space-y-1 text-xs">
                {hydro.map((h) => (
                  <li key={h.stacja}>
                    <span className="font-medium">{h.stacja}</span>
                    {h.cm != null ? ` · ${h.cm} cm` : " · brak odczytu"}
                    {h.at ? ` · ${h.at.replace("T", " ").slice(0, 16)}` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-faint">Dane: IMGW-PIB, hydro.imgw.pl</p>
            </Box>
          )}
        </div>

        {weather ? (
          <div className="mt-3 space-y-3">
            <section>
              <h2 className="text-sm font-semibold">Pogoda na łowisku</h2>
              <div className="mt-2 rounded-2xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-card-2 text-primary">
                    <WeatherGlyph kind={weatherIcon(weather.weatherCode)} size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-3xl font-semibold leading-none tabular-nums">
                      {weather.temp.toFixed(0)}°
                    </p>
                    <p className="mt-1.5 text-sm text-muted">{weatherLabel(weather.weatherCode)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <SpotTile
                  label="Wiatr"
                  value={`${weather.wind.toFixed(0)} km/h`}
                  hint={windArrow(weather.windDir)}
                />
                <SpotTile
                  label="Ciśnienie"
                  value={`${weather.pressure.toFixed(0)} hPa`}
                  hint={
                    weather.pressureTrend === "down"
                      ? "spada"
                      : weather.pressureTrend === "up"
                        ? "rośnie"
                        : "stabilne"
                  }
                />
                <SpotTile
                  label="Opad"
                  value={`${weather.precipitation.toFixed(1)} mm`}
                  hint={weather.precipitation < 0.2 ? "bez opadu" : "teraz"}
                />
                <SpotTile
                  label="Woda"
                  value={weather.waterTemp != null ? `${weather.waterTemp.toFixed(1)}°` : "brak"}
                  hint={`powietrze ${weather.temp.toFixed(0)}°`}
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold">Żerowanie</h2>
              <div className="mt-2 rounded-2xl bg-card p-3.5 ring-1 ring-border">
                <p className="text-xs font-medium text-faint">Dziś</p>
                <p
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold",
                    toneClass(feedingTone(score ?? 0)),
                  )}
                >
                  {feedingLabel(score ?? 0)}
                </p>
                <p className="mt-1.5 text-xs tabular-nums text-muted">
                  {score}/100 · księżyc {moon.name} ({moon.illum}%)
                </p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 min-[400px]:grid-cols-4">
                {dayParts(weather).map((p) => (
                  <div key={p.id} className="rounded-2xl bg-card p-3 text-left ring-1 ring-border">
                    <p className="text-xs text-faint">{p.label}</p>
                    <p
                      className={cn(
                        "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                        toneClass(feedingTone(p.score)),
                      )}
                    >
                      {p.text}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-muted">{p.score}/100</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {weather.daily.map((d, i) => {
                  const dayFeed = days[i];
                  const kind = weatherIcon(d.weatherCode);
                  const tone = dayFeed ? feedingTone(dayFeed.score) : "primary";
                  return (
                    <div
                      key={d.date}
                      className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-border"
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-card-2 text-primary">
                        <WeatherGlyph kind={kind} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">
                          {new Date(d.date).toLocaleDateString("pl-PL", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs text-muted">{weatherLabel(d.weatherCode)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {d.tmin.toFixed(0)}° / {d.tmax.toFixed(0)}°
                        </p>
                        {dayFeed && (
                          <p
                            className={cn(
                              "mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                              toneClass(tone),
                            )}
                          >
                            {dayFeed.text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {bio && (
              <section>
                <h2 className="text-sm font-semibold">Biomet</h2>
                <div className="mt-2 rounded-2xl bg-card p-3.5 ring-1 ring-border">
                  <p
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold",
                      toneClass(bio.tone),
                    )}
                  >
                    {bio.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{bio.detail}</p>
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <FeedSkeleton />
          </div>
        )}

        <div className="mt-3 grid gap-2">
          <Box title="Współrzędne">
            <div className="flex flex-col gap-2 min-[380px]:flex-row">
              <ActionBtn onClick={copyCoords} aria-label="Kopiuj współrzędne">
                {copiedCoords ? "Skopiowano" : formatCoords(w.lat, w.lng)}
              </ActionBtn>
              <ActionBtn onClick={sharePin} tone="primary" aria-label="Kopiuj pinezkę mapy">
                {copiedPin ? "Skopiowano" : "Pinezka"}
              </ActionBtn>
            </div>
            <button
              type="button"
              onClick={() => {
                void shareWaterCard(w).catch(() => flashShareFail());
              }}
              className="tap mt-2 min-h-11 w-full rounded-full bg-card-2 text-sm font-semibold ring-1 ring-border"
            >
              {shareFail ? "Nie udało się udostępnić" : "Udostępnij kartę"}
            </button>
          </Box>
          <Box title="Porównaj">
            <button
              type="button"
              onClick={() => openCompare(w.id)}
              className="tap min-h-11 w-full rounded-full bg-card-2 text-sm font-semibold ring-1 ring-border"
            >
              Porównaj z innym łowiskiem
            </button>
          </Box>
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <section className="mt-4">
          <h2 className="text-sm font-semibold">W pobliżu</h2>
          <ul className="mt-2 space-y-1 rounded-2xl bg-card p-3 ring-1 ring-border">
            {nearestWaters(w, 5).map(({ w: n, km }) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openSpot(n.id)}
                  className="tap flex w-full items-baseline justify-between gap-2 py-1 text-left text-sm"
                >
                  <span className="min-w-0 truncate font-medium">{waterTitle(n)}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatDistance(km)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ScreenFrame>
  );
}
