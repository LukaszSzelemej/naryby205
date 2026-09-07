import { useEffect, useRef, useState } from "react";
import { useAtlas } from "@/lib/store";

function norm(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function shortest(from: number, to: number) {
  return from + ((((to - from) % 360) + 540) % 360) - 180;
}

function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dlat = (b.lat - a.lat) * 111_320;
  const dlng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dlat, dlng);
}

function fromDevice(e: DeviceOrientationEvent): number | null {
  const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
  if (typeof ios === "number" && Number.isFinite(ios)) return norm(ios);
  if (typeof e.alpha !== "number" || !Number.isFinite(e.alpha)) return null;
  if (!e.absolute) return null;
  const screenAngle =
    (typeof screen !== "undefined" && screen.orientation?.angle) ||
    (typeof window !== "undefined" && typeof window.orientation === "number" ? window.orientation : 0) ||
    0;
  return norm(360 - e.alpha + screenAngle);
}

export function useSmoothAngle(target: number) {
  const ref = useRef(target);
  const [value, setValue] = useState(target);
  useEffect(() => {
    const next = shortest(ref.current, target);
    ref.current = next;
    setValue(next);
  }, [target]);
  return value;
}

export async function requestHeadingPermission() {
  const DOE = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  if (typeof DOE.requestPermission !== "function") return true;
  try {
    return (await DOE.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Device heading in degrees (0 = north). Magnetometer preferred, GPS heading while moving. */
export function useCompassHeading() {
  const [mag, setMag] = useState<number | null>(null);
  const [gps, setGps] = useState<number | null>(null);
  const allowGeo = useAtlas((s) => Boolean(s.consent?.geo));

  useEffect(() => {
    if (!allowGeo || typeof window === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const h = p.coords.heading;
        if (typeof h === "number" && Number.isFinite(h)) setGps(norm(h));
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const prev = useAtlas.getState().geo;
        if (!prev || metersBetween(prev, { lat, lng }) > 18) {
          useAtlas.getState().setGeo({ lat, lng });
        }
      },
      () => {
        /* keep last */
      },
      { enableHighAccuracy: true, maximumAge: 2500, timeout: 12_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [allowGeo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = (e: Event) => {
      const h = fromDevice(e as DeviceOrientationEvent);
      if (h != null) setMag(h);
    };
    window.addEventListener("deviceorientationabsolute", on);
    window.addEventListener("deviceorientation", on);
    return () => {
      window.removeEventListener("deviceorientationabsolute", on);
      window.removeEventListener("deviceorientation", on);
    };
  }, []);

  const heading = mag ?? gps ?? 0;
  const live = mag != null || gps != null;
  return { heading, live };
}
