import type { ReactNode } from "react";
import { useAtlas } from "@/lib/store";
import { MAP_CENTER, DISCLAIMER } from "@/lib/catalog";
import { BackBtn } from "@/components/Chrome";
import { WeatherGlyph, PressureGlyph } from "@/components/icons";
import {
  biomet,
  dayParts,
  feedingTips,
  feedingTone,
  forecastFeeding,
  moonPhase,
} from "@/lib/feeding";
import { weatherIcon, weatherLabel, windArrow, pressureTrendLabel } from "@/lib/weather";
import type { WeatherNow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScreenFrame, WeatherSkeleton } from "@/components/States";

function fmtTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
      <p className="text-xs font-medium text-faint">{label}</p>
      <p className="mt-1.5 text-lg font-semibold leading-tight tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

function toneClass(tone: "ok" | "primary" | "warn" | "danger") {
  if (tone === "ok") return "bg-ok/15 text-ok";
  if (tone === "primary") return "bg-primary/20 text-primary";
  if (tone === "warn") return "bg-warn/20 text-warn";
  return "bg-danger/15 text-danger";
}

export function WeatherPage({ weather }: { weather: WeatherNow | null }) {
  const back = useAtlas((s) => s.back);
  const geo = useAtlas((s) => s.geo);
  const moon = moonPhase();
  if (!weather) {
    return (
      <ScreenFrame onBack={back}>
        <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
          <div className="flex items-center gap-2">
            <BackBtn onClick={back} />
            <h1 className="text-lg font-semibold">Pogoda</h1>
          </div>
          <WeatherSkeleton />
        </div>
      </ScreenFrame>
    );
  }
  const bio = biomet(weather);
  const parts = dayParts(weather);
  const days = forecastFeeding(weather);
  const tips = feedingTips(weather);
  const loc = geo ?? { lat: MAP_CENTER[0], lng: MAP_CENTER[1] };
  const icon = weatherIcon(weather.weatherCode);
  const feed = days[0];

  return (
    <ScreenFrame onBack={back}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <div className="flex items-center gap-2">
          <BackBtn onClick={back} />
          <h1 className="text-lg font-semibold">Pogoda</h1>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <p className="mt-1 text-xs text-muted">
          {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
          {weather.stale ? " · dane orientacyjne" : ""}
        </p>

        <section className="mt-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "grid size-16 shrink-0 place-items-center rounded-2xl pressure-mark",
                weather.pressureTrend === "down"
                  ? "is-down"
                  : weather.pressureTrend === "up"
                    ? "is-up"
                    : "is-flat",
              )}
              title={`Ciśnienie ${pressureTrendLabel(weather.pressureTrend)}`}
            >
              <PressureGlyph trend={weather.pressureTrend} size={32} />
            </div>
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-card-2 text-primary">
              <WeatherGlyph kind={icon} size={32} />
            </div>
            <div className="min-w-0">
              <p className="text-4xl font-semibold leading-none tabular-nums">
                {weather.temp.toFixed(0)}°
              </p>
              <p className="mt-1.5 text-sm text-muted">{weatherLabel(weather.weatherCode)}</p>
            </div>
          </div>
          {feed && (
            <p className="mt-3 rounded-xl bg-card-2 px-3 py-2 text-sm">
              Żerowanie dziś: <span className="font-semibold">{feed.text}</span>
            </p>
          )}
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2">
          <Tile
            label="Wiatr"
            value={`${weather.wind.toFixed(0)} km/h`}
            hint={windArrow(weather.windDir)}
          />
          <Tile
            label="Ciśnienie"
            value={`${weather.pressure.toFixed(0)} hPa`}
            hint={
              weather.pressureTrend === "flat" ? (
                pressureTrendLabel(weather.pressureTrend)
              ) : (
                <span className="inline-flex items-center gap-1">
                  <PressureGlyph trend={weather.pressureTrend} size={12} />
                  {pressureTrendLabel(weather.pressureTrend)}
                </span>
              )
            }
          />
          <Tile
            label="Opad"
            value={`${weather.precipitation.toFixed(1)} mm`}
            hint={weather.precipitation < 0.2 ? "bez opadu" : "teraz"}
          />
          <Tile label="Wilgotność" value={`${weather.humidity.toFixed(0)}%`} />
          <Tile
            label="Woda"
            value={weather.waterTemp != null ? `${weather.waterTemp.toFixed(1)}°` : "brak"}
            hint={`powietrze ${weather.temp.toFixed(0)}°`}
          />
          <Tile label="Księżyc" value={moon.name} hint={`${moon.illum}% tarczy`} />
          <Tile label="Wschód" value={fmtTime(weather.sunrise)} />
          <Tile label="Zachód" value={fmtTime(weather.sunset)} />
        </section>

        <section className="mt-4">
          <h2 className="text-sm font-semibold">Żerowanie</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {parts.map((p) => {
              const tone = feedingTone(p.score);
              return (
                <div key={p.id} className="rounded-2xl bg-card p-3 text-left ring-1 ring-border">
                  <p className="text-xs text-faint">{p.label}</p>
                  <p className={cn("mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", toneClass(tone))}>
                    {p.text}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-muted">{p.score}/100</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-3.5 ring-1 ring-border">
          <h2 className="text-sm font-semibold">Biomet</h2>
          <p
            className={cn(
              "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold",
              toneClass(bio.tone),
            )}
          >
            {bio.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{bio.detail}</p>
        </section>

        <section className="mt-4">
          <h2 className="text-sm font-semibold">7 dni</h2>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {weather.daily.map((d, i) => {
              const dayFeed = days[i];
              const kind = weatherIcon(d.weatherCode);
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
                    <p className="text-xs text-muted">
                      {weatherLabel(d.weatherCode)}
                      {dayFeed ? ` · żer ${dayFeed.text.toLowerCase()}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {d.tmin.toFixed(0)}° / {d.tmax.toFixed(0)}°
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {d.rain.toFixed(0)} mm · {d.wind.toFixed(0)} km/h
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4 space-y-2">
          {tips.map((t) => (
            <div key={t.title} className="rounded-2xl bg-card p-3.5 text-left ring-1 ring-border">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{t.text}</p>
            </div>
          ))}
        </section>
        <p className="mt-6 text-left text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}