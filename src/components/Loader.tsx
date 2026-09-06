import { useEffect, useRef, useState } from "react";
import { INSTAGRAM, SITE_URL, VERSION } from "@/lib/brand";
import { loadCatalog, WATERS } from "@/lib/catalog";
import { openExternal } from "@/lib/utils";

type Props = { online: number; onDone: () => void; replay?: boolean };

export function Loader({ online, onDone, replay }: Props) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dur = reduce ? 280 : replay ? 900 : 1400;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const done = useRef(false);
  const [pct, setPct] = useState(1);
  const [fail, setFail] = useState<string | null>(null);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setPct(100);
    onDoneRef.current();
  };

  useEffect(() => {
    done.current = false;
    setPct(1);
    setFail(null);
    const start = performance.now();
    let raf = 0;
    let live = true;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setPct(Math.max(1, Math.min(99, Math.round(t * 100))));
      if (t < 1 && live) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const cap = window.setTimeout(() => {
      if (!live) return;
      if (WATERS.length) finish();
      else setFail("Nie udało się wczytać katalogu. Spróbuj ponownie.");
    }, dur + 4000);

    void loadCatalog()
      .then(() => {
        if (!live) return;
        const left = Math.max(0, dur - (performance.now() - start));
        window.setTimeout(() => {
          if (live) finish();
        }, left);
      })
      .catch(() => {
        if (!live) return;
        setFail("Nie udało się wczytać katalogu. Spróbuj ponownie.");
      });

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(cap);
    };
  }, [dur]);

  return (
    <div className="relative z-40 flex h-full w-full flex-col items-center justify-between bg-background px-6 py-8 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 50% at 50% 38%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 70%)",
        }}
      />
      <div className="h-6" />
      <div className="splash-stack relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => openExternal(INSTAGRAM)}
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
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Atlas wędkarski
          </h1>
          <p className="mt-1 text-sm text-muted">{SITE_URL.replace("https://", "")}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-primary">
            Zachodniopomorskie
          </p>
        </div>
        <div className="splash-meter mt-2 w-full">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-faint">
            Ładowanie mapy
          </p>
          <div
            className="mx-auto mt-2 h-1.5 w-[70%] overflow-hidden rounded-full bg-card-2"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Postęp ładowania"
          >
            <div className="splash-fill h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs tabular-nums text-muted" aria-hidden>
            {pct}%
          </p>
          {fail && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-danger">{fail}</p>
              <button
                type="button"
                className="min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                onClick={() => {
                  setFail(null);
                  setPct(1);
                  done.current = false;
                  void loadCatalog()
                    .then(() => finish())
                    .catch(() =>
                      setFail("Nie udało się wczytać katalogu. Spróbuj ponownie."),
                    );
                }}
              >
                Spróbuj ponownie
              </button>
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
          <span className="online-dot" />
          <span>
            online: <span className="tabular-nums font-medium">{online}</span>
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
