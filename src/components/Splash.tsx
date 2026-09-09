import { useLayoutEffect } from "react";
import { INSTAGRAM, SITE_URL, VERSION, splashPackName } from "@/lib/catalog";

/** First-paint overlay. CSS hides it even if React never hydrates. */
export function SplashOverlay() {
  useLayoutEffect(() => {
    const el = document.getElementById("atlas-splash");
    if (!el) return;
    const hide = () => el.classList.add("is-out");
    const t = window.setTimeout(hide, 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      id="atlas-splash"
      className="atlas-splash"
      role="status"
      aria-label="Ładowanie"
      suppressHydrationWarning
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 50% at 50% 38%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 70%)",
        }}
      />
      <div className="h-6" />
      <div className="splash-stack relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noreferrer"
          className="seal-glow block size-36 rounded-full"
          aria-label="Instagram Method Feeder Szczecin"
        >
          <img
            src="/brand/logo-karp-circle.png"
            alt="Method Feeder Szczecin"
            className="size-full rounded-full object-cover"
            width={144}
            height={144}
            decoding="async"
            fetchPriority="high"
          />
        </a>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Atlas wędkarski
          </h1>
          <p className="mt-1 text-sm text-muted">{SITE_URL.replace("https://", "")}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-primary">
            {splashPackName()}
          </p>
        </div>
        <div className="splash-meter mt-2 w-full">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-faint">
            Ładowanie mapy
          </p>
          <div className="mx-auto mt-2 h-1.5 w-[70%] overflow-hidden rounded-full bg-card-2">
            <div className="splash-fill h-full rounded-full" />
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
          <span className="online-dot" />
          <span>
            online: <span className="tabular-nums font-medium">1</span>
          </span>
        </div>
      </div>
      <div className="relative z-10 pb-[max(3.5rem,calc(env(safe-area-inset-bottom)+3rem))] text-xs leading-relaxed text-faint">
        <p>Stworzone z pasji do wędkowania</p>
        <p className="mt-1">Aplikacja ma charakter poglądowy.</p>
        <p className="mt-1">Wersja {VERSION}</p>
      </div>
    </div>
  );
}
