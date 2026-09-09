import type { WeatherDay, WeatherNow } from "@/lib/types";

const cache = new Map<string, { at: number; data: WeatherNow }>();

function keyOf(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export function pressureTrendLabel(trend: WeatherNow["pressureTrend"]) {
  if (trend === "down") return "spada";
  if (trend === "up") return "rośnie";
  return "stabilne";
}

export function weatherIcon(code: number): "sun" | "partly" | "cloud" | "rain" | "storm" | "snow" | "fog" {
  if (code === 0) return "sun";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 95) return "storm";
  if (code >= 51) return "rain";
  return "cloud";
}

export function weatherLabel(code: number) {
  if (code === 0) return "Słonecznie";
  if (code === 1) return "Prawie bezchmurnie";
  if (code === 2) return "Częściowe zachmurzenie";
  if (code === 3) return "Pochmurno";
  if (code === 45 || code === 48) return "Mgła";
  if (code >= 95) return "Burza";
  if (code >= 71 && code <= 77) return "Śnieg";
  if (code >= 61) return "Deszcz";
  if (code >= 51) return "Mżawka";
  return "Zmienne";
}

function fallback(lat: number, lng: number): WeatherNow {
  const now = new Date();
  const rise = new Date(now);
  rise.setHours(6, 12, 0, 0);
  const set = new Date(now);
  set.setHours(19, 28, 0, 0);
  const daily: WeatherDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const tmax = 18 - i * 0.4;
    const tmin = 9 - i * 0.2;
    return {
      date: d.toISOString().slice(0, 10),
      tmax,
      tmin,
      rain: i === 2 ? 2.1 : 0.1,
      weatherCode: i === 2 ? 61 : 2,
      wind: 12 + i,
      water: null,
    };
  });
  const waters = fillWaterTemps(daily, null);
  void lat;
  void lng;
  return {
    temp: 14.2,
    pressure: 1014,
    pressureTrend: "flat",
    precipitation: 0,
    wind: 14,
    windDir: 270,
    weatherCode: 2,
    humidity: 68,
    waterTemp: waters[0] ?? null,
    waterSource: "estimate",
    sunrise: rise.toISOString(),
    sunset: set.toISOString(),
    daily: daily.map((d, i) => ({ ...d, water: waters[i] })),
    stale: true,
  };
}

function isCoastal(lat: number, lng: number) {
  return lat >= 53.88 || (lat >= 53.3 && lng <= 14.85);
}

function lagWater(means: number[]) {
  return means.map((_, i) => {
    const a = means[i];
    const b = means[Math.max(0, i - 1)];
    const c = means[Math.max(0, i - 2)];
    const raw = 0.45 * a + 0.35 * b + 0.2 * c;
    return Math.round(Math.max(0.4, raw - 1.1) * 10) / 10;
  });
}

function fillWaterTemps(daily: WeatherDay[], sst: (number | null)[] | null) {
  const means = daily.map((d) => (d.tmax + d.tmin) / 2);
  const estimate = lagWater(means);
  if (sst && sst.length) {
    return daily.map((_, i) => {
      const v = sst[i];
      return v != null && Number.isFinite(v) ? Math.round(v * 10) / 10 : estimate[i];
    });
  }
  return estimate;
}

async function fetchMarineSst(
  lat: number,
  lng: number,
  signal: AbortSignal,
): Promise<(number | null)[] | null> {
  if (!isCoastal(lat, lng)) return null;
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: "sea_surface_temperature_max,sea_surface_temperature_min",
    forecast_days: "7",
    timezone: "Europe/Warsaw",
  });
  const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`, { signal });
  if (!res.ok) return null;
  const a = (await res.json()) as {
    daily?: { sea_surface_temperature_max?: (number | null)[]; sea_surface_temperature_min?: (number | null)[] };
  };
  const hi = a.daily?.sea_surface_temperature_max;
  const lo = a.daily?.sea_surface_temperature_min;
  if (!hi?.length) return null;
  return hi.map((v, i) => {
    const b = lo?.[i];
    if (v == null && b == null) return null;
    return ((v ?? b ?? 0) + (b ?? v ?? 0)) / 2;
  });
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherNow> {
  const k = keyOf(lat, lng);
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < 12 * 60 * 1000) return hit.data;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
    hourly: "pressure_msl",
    daily: [
      "sunrise",
      "sunset",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "weather_code",
      "wind_speed_10m_max",
    ].join(","),
    timezone: "Europe/Warsaw",
    forecast_days: "7",
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const [res, sst] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: ctrl.signal }),
      fetchMarineSst(lat, lng, ctrl.signal).catch(() => null),
    ]);
    if (!res.ok) throw new Error("pogoda");
    const a = (await res.json()) as {
      current: Record<string, number>;
      hourly: { time: string[]; pressure_msl: number[] };
      daily: Record<string, number[] | string[]>;
    };
    const hours = a.hourly.time ?? [];
    const now = Date.now();
    let hi = 0;
    let best = Infinity;
    for (let i = 0; i < hours.length; i++) {
      const d = Math.abs(new Date(hours[i]).getTime() - now);
      if (d < best) {
        best = d;
        hi = i;
      }
    }
    const pNow = a.current.pressure_msl;
    const pThen = a.hourly.pressure_msl[Math.max(0, hi - 3)] ?? pNow;
    const s = pNow - pThen;
    const trend: WeatherNow["pressureTrend"] =
      s <= -1.2 ? "down" : s >= 1.2 ? "up" : "flat";
    const times = a.daily.time as string[];
    const daily: WeatherDay[] = times.map((date, i) => ({
      date,
      tmax: Number(a.daily.temperature_2m_max[i] ?? 0),
      tmin: Number(a.daily.temperature_2m_min[i] ?? 0),
      rain: Number(a.daily.precipitation_sum[i] ?? 0),
      weatherCode: Number(a.daily.weather_code[i] ?? 0),
      wind: Number(a.daily.wind_speed_10m_max[i] ?? 0),
    }));
    const waters = fillWaterTemps(daily, sst);
    const useSst = Boolean(sst?.some((v) => v != null));
    const data: WeatherNow = {
      temp: a.current.temperature_2m,
      pressure: a.current.pressure_msl,
      pressureTrend: trend,
      precipitation: a.current.precipitation,
      wind: a.current.wind_speed_10m,
      windDir: a.current.wind_direction_10m,
      weatherCode: a.current.weather_code,
      humidity: a.current.relative_humidity_2m,
      waterTemp: waters[0] ?? null,
      waterSource: useSst ? "sst" : "estimate",
      sunrise: String(a.daily.sunrise[0] ?? ""),
      sunset: String(a.daily.sunset[0] ?? ""),
      daily: daily.map((d, i) => ({ ...d, water: waters[i] })),
    };
    cache.set(k, { at: Date.now(), data });
    return data;
  } catch {
    return hit ? { ...hit.data, stale: true } : fallback(lat, lng);
  } finally {
    clearTimeout(timer);
  }
}

export function windArrow(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export function windFromLabel(deg: number) {
  const dirs = [
    "północy",
    "północnego wschodu",
    "wschodu",
    "południowego wschodu",
    "południa",
    "południowego zachodu",
    "zachodu",
    "północnego zachodu",
  ];
  return dirs[Math.round(deg / 45) % 8];
}
