import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function FishPinSvg({ color = "#2dd4bf", size = 28 }: { color?: string; size?: number }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24" width="${size}" height="${Math.round(size * 0.6)}" fill="none">
    <polygon points="1.5,12 12,6.2 12,17.8" fill="${color}" opacity="0.82"/>
    <polygon points="12,6.2 24,3.4 27,12 12,12" fill="${color}"/>
    <polygon points="12,12 27,12 24.4,20.4 12,17.8" fill="${color}" opacity="0.72"/>
    <polygon points="24,3.4 37,9.4 27,12" fill="${color}" opacity="0.9"/>
    <polygon points="27,12 37,9.4 38.8,12.4 25.6,18.6" fill="${color}" opacity="0.65"/>
    <polygon points="18.4,7.2 24.2,1.2 26.6,6.6" fill="${color}" opacity="0.95"/>
    <circle cx="33.2" cy="10.3" r="2.1" fill="#1e293b"/>
    <circle cx="33.9" cy="9.7" r="0.7" fill="#e2e8f0"/>
  </svg>`;
}

export function CoffeeIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path
        d="M5 8h11a1 1 0 0 1 1 1v3.2A4.8 4.8 0 0 1 12.2 17H9.8A4.8 4.8 0 0 1 5 12.2V9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M17 9.5h1.6A2.4 2.4 0 0 1 21 11.9v.4A2.4 2.4 0 0 1 18.6 14.7H17" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 19.5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 4.5c.4 1 .2 1.7-.3 2.4M12 4.2c.5 1 .2 1.8-.2 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MapGlyph({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2v-13Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 4.5v13M15 6.5v13" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function ListGlyph({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="4.2" cy="6" r="1.2" fill="currentColor" />
      <circle cx="4.2" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.2" cy="18" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function BadgeGlyph({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v5l3 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function StarGlyph({ size = 20, filled = false, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden {...p}>
      <path
        d="M12 3.6 14.4 9l6 .6-4.5 3.9 1.4 5.9L12 16.6 6.7 19.4l1.4-5.9L3.6 9.6 9.6 9 12 3.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookGlyph({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19.2A2.5 2.5 0 0 1 7.5 17H20" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function PackGlyph({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function WeatherGlyph({
  kind = "partly",
  size = 20,
  ...p
}: IconProps & { kind?: "sun" | "partly" | "cloud" | "rain" | "storm" | "snow" | "fog" }) {
  if (kind === "sun") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "rain" || kind === "storm") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
        <path d="M7 15h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.5 1.5A3.5 3.5 0 0 0 7 15Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 17.5 8 21M12.5 17.5 11.5 21M16 17.5 15 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path d="M7 16h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.5 1.5A3.5 3.5 0 0 0 7 16Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function PressureGlyph({
  trend,
  size = 16,
  ...p
}: IconProps & { trend: "up" | "down" }) {
  const up = trend === "up";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path
        d="M6.2 16.4a7.2 7.2 0 1 1 11.6 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
      <g className={up ? "pressure-arrow is-up" : "pressure-arrow is-down"}>
        {up ? (
          <path
            d="M12 16.2V8.2M8.2 11.6 12 7.6l3.8 4"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M12 7.8v8M8.2 12.4 12 16.4l3.8-4"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  );
}

export function FishOutline({ size = 22, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <path
        d="M3 12c4.2-4.4 8.6-5.6 14.2-3.4 1.4.6 3.6 2 4.8 3.4-1.2 1.4-3.4 2.8-4.8 3.4C11.6 17.6 7.2 16.4 3 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14.2 8.2 16.6 5.4 17.4 8.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="18.2" cy="11.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function SearchGlyph({ size = 20, ...p }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
