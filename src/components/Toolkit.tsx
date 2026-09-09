import { useCallback, useMemo, useRef, useState } from "react";
import { CoffeeIcon, FishOutline, SearchGlyph } from "@/components/icons";
import { WaterFeed } from "@/components/SpotList";
import { BackBtn, OutLink, PaperPicker, PhoneText, TelBtn } from "@/components/Chrome";
import {
  ALPHABET,
  CUPLINK,
  DISCLAIMER,
  INSTAGRAM,
  letterOf,
  linkLabel,
  MANAGERS,
  protectionOf,
  formatProtect,
  closedEndingDays,
  closedYearRows,
  MONTHS_SHORT,
  safeHttpUrl,
  SPECIES,
  SPECIES_LETTERS,
  sanitizeQuery,
  watersForSpecies,
  watersOfHost,
  hostGroupOf,
  hostKeyOfManager,
  labelOfHostKey,
  managerFromHostKey,
  foldPl,
} from "@/lib/catalog";
import {
  COFFEE_COPY,
  COOKIES_TEXT,
  DOKUMENTY,
  ETYKIETA,
  INSTALL_COPY,
  LICENSES_COPY,
  METHOD_FEEDER,
  OFFLINE_COPY,
  PORADNIK,
  ZAPIS_COPY,
} from "@/lib/content";
import { stockingOfManager } from "@/lib/stocking";
import { useAtlas, type KitTab } from "@/lib/store";
import { setHydroPref, hydroPref, setTarloPref, tarloPref } from "@/lib/tarlo";
import { cn, openExternal, phonesIn } from "@/lib/utils";
import { clearOffline, downloadOffline, loadPackInfo, offlineCount } from "@/lib/offline";
import { EmptyState, FeedSkeleton, Meter, ScreenFrame } from "@/components/States";

function ManagersList() {
  const openHost = useAtlas((s) => s.openHost);
  return (
    <>
      {Object.values(MANAGERS).map((m) => {
        const web = safeHttpUrl(m.website);
        const social = safeHttpUrl(m.socialUrl);
        const permit = safeHttpUrl(m.permitUrl);
        const socialBtn = social && social !== web ? social : null;
        const phones = phonesIn(m.priceNote, m.name);
        const hostKey = hostKeyOfManager(m.id);
        const stock = stockingOfManager(m.id);
        return (
          <article key={m.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
            <button
              type="button"
              onClick={() => openHost(hostKey)}
              className="tap block w-full text-left"
            >
              <p className="font-semibold text-primary underline decoration-primary/40 underline-offset-2">
                {m.shortName}
              </p>
              <p className="text-sm text-muted">{m.name}</p>
              <p className="mt-0.5 text-xs text-faint">Łowiska tego gospodarza</p>
            </button>
            {m.priceNote && (
              <p className="mt-1 text-sm text-faint">
                <PhoneText text={m.priceNote} />
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
              {permit && (
                <OutLink href={permit}>{m.permitLabel ?? "Zezwolenie"}</OutLink>
              )}
              {stock && (
                <OutLink href={stock.url} tone="secondary">
                  {stock.label}
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
          </article>
        );
      })}
    </>
  );
}

export function PermitsPage() {
  const setScreen = useAtlas((s) => s.setScreen);
  const n = Object.keys(MANAGERS).length;
  return (
    <ScreenFrame onBack={() => setScreen("map")}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            Pozwolenia <span className="tabular-nums text-muted">({n})</span>
          </h1>
          <button
            type="button"
            onClick={() => openExternal(CUPLINK)}
            className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg"
            aria-label="Postaw kawę"
          >
            <CoffeeIcon size={18} />
          </button>
        </header>
        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <div className="mt-3">
          <PaperPicker />
        </div>
        <div className="kit-pane mt-4 space-y-3 text-sm">
          <p className="text-sm text-muted">{DOKUMENTY.clubs}</p>
          <p className="text-sm text-muted">{DOKUMENTY.privateNote}</p>
          <ManagersList />
        </div>
        <p className="mt-8 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}

const TABS: { id: KitTab; label: string; alwaysOrange?: boolean }[] = [
  { id: "dokumenty", label: "Dokumenty" },
  { id: "etykieta", label: "Etykieta" },
  { id: "feeder", label: "Method Feeder" },
  { id: "poradnik", label: "Poradnik" },
  { id: "offline", label: "Offline" },
  { id: "zapis", label: "Zapis" },
  { id: "ciasteczka", label: "Ciasteczka" },
  { id: "kawa", label: "Postaw kawę", alwaysOrange: true },
];

const COFFEE_SECTIONS = [
  COFFEE_COPY.paragraphs.slice(0, 1),
  COFFEE_COPY.paragraphs.slice(1, 3),
  COFFEE_COPY.paragraphs.slice(3, 6),
  COFFEE_COPY.paragraphs.slice(6, 8),
  COFFEE_COPY.paragraphs.slice(8, 9),
  COFFEE_COPY.paragraphs.slice(9),
];

function ClosedNow() {
  const closed = SPECIES.filter((s) => protectionOf(s).active).sort((a, b) =>
    a.name.localeCompare(b.name, "pl"),
  );
  if (!closed.length) {
    return (
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Dziś żaden gatunek z atlasu nie jest w okresie ochronnym na wodach śródlądowych.
      </p>
    );
  }
  return (
    <section className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Dziś ochrona</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {closed.map((s) => (
          <span key={s.id} className="rounded-full bg-danger/15 px-2.5 py-1 text-xs font-semibold text-danger">
            {s.name}
          </span>
        ))}
      </div>
    </section>
  );
}

function YearTarlo() {
  const year = new Date().getFullYear();
  const nowM = new Date().getMonth();
  const rows = closedYearRows(year);
  if (!rows.length) return null;
  return (
    <section className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
        Kalendarz tarła {year}
      </h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Okres ochronny RAPR na śródlądziu. Czerwień — nie łów. Poglądowo, sprawdź aktualny regulamin.
      </p>
      <div className="mt-3 min-w-0 overflow-x-auto">
        <div className="min-w-[20rem] space-y-1.5">
        <div className="grid grid-cols-[minmax(4.8rem,1.1fr)_repeat(12,minmax(0,1fr))] gap-0.5 text-[9px] font-semibold text-faint">
          <span />
          {MONTHS_SHORT.map((m, i) => (
            <span
              key={m}
              className={cn("text-center", i === nowM && "text-primary")}
            >
              {m}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.id}>
            <div className="grid grid-cols-[minmax(4.8rem,1.1fr)_repeat(12,minmax(0,1fr))] items-center gap-0.5">
              <p className="truncate pr-1 text-[11px] font-medium leading-tight">{r.name}</p>
              {r.months.map((on, i) => (
                <span
                  key={i}
                  title={`${MONTHS_SHORT[i]} · ${r.name}${on ? " — ochrona" : ""}`}
                  className={cn(
                    "h-5 rounded-sm",
                    on ? "bg-danger/65" : "bg-card-2",
                    i === nowM && "ring-1 ring-primary/70",
                  )}
                />
              ))}
            </div>
            <p className="pl-[0.1rem] text-[10px] text-faint">{r.period}</p>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

export function SpeciesList() {
  const setScreen = useAtlas((s) => s.setScreen);
  const [letter, setLetter] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const species = useMemo(() => {
    const n = foldPl(sanitizeQuery(q).trim());
    let list = [...SPECIES].sort((a, b) => a.name.localeCompare(b.name, "pl"));
    if (n) {
      list = list.filter(
        (s) => foldPl(s.name).includes(n) || foldPl(s.latin).includes(n),
      );
    }
    if (letter) list = list.filter((s) => letterOf(s.name) === letter);
    return list;
  }, [q, letter]);

  let last = "";

  return (
    <ScreenFrame onBack={() => setScreen("map")}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            Ryby <span className="tabular-nums text-muted">({species.length})</span>
          </h1>
          <button
            type="button"
            onClick={() => openExternal(CUPLINK)}
            className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg"
            aria-label="Postaw kawę"
          >
            <CoffeeIcon size={18} />
          </button>
        </header>

        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <ClosedNow />
        <YearTarlo />

        <div className="kit-pane mt-4">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(sanitizeQuery(e.target.value))}
              placeholder="Szukaj gatunku…"
              className={cn(
                "search-input-dark w-full rounded-full bg-card-2 ring-1 ring-border outline-none",
                q ? "pr-11" : "",
              )}
            />
            {q.length > 0 && (
              <button
                type="button"
                aria-label="Wyczyść"
                onClick={() => setQ("")}
                className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center text-lg leading-none text-muted"
              >
                ×
              </button>
            )}
          </div>
          <div className="mt-3 space-y-1">
            {ALPHABET.map((row, i) => (
              <div key={i} className="grid grid-cols-10 gap-1">
                {row.map((L) => (
                  <button
                    key={L}
                    type="button"
                    disabled={!SPECIES_LETTERS.has(L)}
                    onClick={() => {
                      if (!SPECIES_LETTERS.has(L)) return;
                      setLetter(letter === L ? null : L);
                    }}
                    className={cn(
                      "tap min-h-8 rounded-md text-xs font-semibold",
                      !SPECIES_LETTERS.has(L)
                        ? "cursor-not-allowed bg-background text-faint/40 opacity-30"
                        : letter === L
                          ? "bg-primary text-primary-foreground"
                          : "bg-card-2 text-muted",
                    )}
                  >
                    {L}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {species.map((s) => {
              const L = letterOf(s.name);
              const show = L !== last;
              last = L;
              const p = protectionOf(s);
              const dim = formatProtect(s, "Szczecin");
              const left = closedEndingDays(s);
              return (
                <div key={s.id}>
                  {show && (
                    <p className="mb-1 mt-3 text-xs font-semibold tracking-widest text-faint">{L}</p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      useAtlas.setState({
                        selectedSpeciesId: s.id,
                        screen: "species-waters",
                        prevScreen: "ryby",
                      })
                    }
                    className="water-card block w-full rounded-2xl bg-card p-3 text-left ring-1 ring-border"
                  >
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs italic text-muted">{s.latin}</p>
                    <p className="mt-1 text-xs font-medium tabular-nums text-foreground">
                      Wymiar: {dim.size} · {dim.limit}
                      {dim.fork ? " · okręgi ZP" : ""}
                    </p>
                    <p className={cn("mt-0.5 text-xs font-medium", p.active ? "text-danger" : "text-ok")}>
                      {p.hasPeriod ? p.label : "Brak okresu ochronnego"}
                    </p>
                    {left != null && left <= 3 && (
                      <p className="mt-0.5 text-xs font-medium text-warn">
                        {left === 0
                          ? "Okres ochronny kończy się dziś"
                          : `Okres ochronny kończy się za ${left} dni`}
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
            {species.length === 0 && (
              <EmptyState
                icon={<SearchGlyph size={26} />}
                title="Brak gatunków"
                body={
                  q.trim()
                    ? `Nic nie pasuje do „${q.trim()}”.`
                    : "Dla wybranej litery nie ma gatunku w atlasie."
                }
                action={() => {
                  setQ("");
                  setLetter(null);
                }}
                actionLabel="Wyczyść filtry"
              />
            )}
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}

export function Toolkit() {
  const tab = useAtlas((s) => s.kitTab) ?? "kawa";
  const setTab = useAtlas((s) => s.setKitTab);
  const setScreen = useAtlas((s) => s.setScreen);
  const [offMsg, setOffMsg] = useState<string | null>(null);
  const [offPct, setOffPct] = useState<number | null>(null);
  const [offBusy, setOffBusy] = useState(false);

  return (
    <ScreenFrame onBack={() => setScreen("map")}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Niezbędnik</h1>
          <button
            type="button"
            onClick={() => openExternal(CUPLINK)}
            className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg"
            aria-label="Postaw kawę"
          >
            <CoffeeIcon size={18} />
          </button>
        </header>

        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>

        <div className="mt-3 grid grid-cols-2 gap-1.5 min-[380px]:grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
              }}
              className={cn(
                "tap min-h-11 rounded-xl px-1 text-xs font-semibold leading-tight",
                t.alwaysOrange
                  ? cn("bg-coffee text-coffee-fg", tab === t.id && "ring-2 ring-white")
                  : tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground ring-1 ring-border",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "dokumenty" && (
          <div className="kit-pane mt-4 space-y-3 text-sm">
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{DOKUMENTY.karta.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{DOKUMENTY.karta.body}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {DOKUMENTY.karta.exam.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{DOKUMENTY.sea.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{DOKUMENTY.sea.body}</p>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{DOKUMENTY.wir.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{DOKUMENTY.wir.body}</p>
            </section>
            <p className="text-sm text-muted">{DOKUMENTY.clubs}</p>
            <p className="text-sm text-muted">{DOKUMENTY.privateNote}</p>
            <ManagersList />
          </div>
        )}

        {tab === "etykieta" && (
          <div className="kit-pane mt-4 space-y-3">
            {ETYKIETA.map((s) => (
              <section key={s.title} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                <h2 className="font-semibold">{s.title}</h2>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
                  {s.items.map((it) => (
                    <li key={it}>• {it}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {tab === "feeder" && (
          <div className="kit-pane mt-4 space-y-3">
            {METHOD_FEEDER.map((s) => (
              <section key={s.title} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                <h2 className="font-semibold">{s.title}</h2>
                {s.body && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                )}
                {s.items && (
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
                    {s.items.map((it) => (
                      <li key={it}>• {it}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}

        {tab === "poradnik" && (
          <div className="kit-pane mt-4 space-y-3">
            {PORADNIK.map((s) => (
              <section key={s.title} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </section>
            ))}
          </div>
        )}

        {tab === "offline" && (
          <div className="kit-pane mt-4 rounded-2xl bg-card p-3 ring-1 ring-border">
            <h2 className="font-semibold">{OFFLINE_COPY.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{OFFLINE_COPY.body}</p>
            {loadPackInfo() && !offBusy && (
              <p className="mt-2 text-sm font-semibold text-ok">Katalog zapisany — możesz jechać bez sieci.</p>
            )}
            {offPct != null && offBusy && (
              <div className="mt-3">
                <Meter value={offPct} label="Postęp pobierania" />
              </div>
            )}
            <button
              type="button"
              disabled={offBusy}
              className="tap mt-4 min-h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70"
              onClick={async () => {
                setOffBusy(true);
                setOffPct(0);
                setOffMsg("Pobieranie…");
                try {
                  await downloadOffline((d, t) => {
                    const p = Math.round((d / t) * 100);
                    setOffPct(p);
                    setOffMsg(`Pobieranie ${p}%`);
                  });
                  const n = await offlineCount();
                  setOffPct(100);
                  setOffMsg(`Gotowe · ${n} plików (mapa + katalog)`);
                } catch {
                  setOffMsg("Nie udało się pobrać. Spróbuj na Wi‑Fi.");
                } finally {
                  setOffBusy(false);
                }
              }}
            >
              {offBusy && offPct != null ? `Pobieranie ${offPct}%` : "Pobierz mapę i katalog"}
            </button>
            <button
              type="button"
              className="tap mt-2 min-h-11 w-full rounded-full bg-card-2 text-sm font-medium"
              onClick={async () => {
                await clearOffline();
                setOffPct(null);
                setOffMsg("Wyczyszczono paczkę offline.");
              }}
            >
              Wyczyść mapę offline
            </button>
            {offMsg && <p className="mt-2 text-center text-xs text-muted">{offMsg}</p>}
          </div>
        )}

        {tab === "zapis" && (
          <div className="kit-pane mt-4 space-y-3">
            <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{ZAPIS_COPY.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{ZAPIS_COPY.body}</p>
            </div>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{ZAPIS_COPY.iosTitle}</h2>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
                {ZAPIS_COPY.ios.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{ZAPIS_COPY.androidTitle}</h2>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
                {ZAPIS_COPY.android.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
            <TarloNotify />
            <HydroNotify />
            <LicensesBlock />
          </div>
        )}

        {tab === "ciasteczka" && (
          <div className="kit-pane mt-4 space-y-3">
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{COOKIES_TEXT.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{COOKIES_TEXT.intro}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{COOKIES_TEXT.about}</p>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{COOKIES_TEXT.useTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{COOKIES_TEXT.useLead}</p>
              <ul className="mt-3 space-y-3">
                {COOKIES_TEXT.items.map((it) => (
                  <li key={it.t}>
                    <p className="text-sm font-semibold text-foreground">{it.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{it.d}</p>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{COOKIES_TEXT.thirdTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{COOKIES_TEXT.third}</p>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{COOKIES_TEXT.rightsTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{COOKIES_TEXT.rights}</p>
            </section>
            <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
              <h2 className="font-semibold">{COOKIES_TEXT.safeTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{COOKIES_TEXT.safe}</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
                {COOKIES_TEXT.how.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === "kawa" && (
          <div className="kit-pane mt-4 space-y-3 text-left">
            <section className="coffee-hero rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="coffee-glow grid size-16 shrink-0 place-items-center rounded-full bg-coffee text-coffee-fg">
                  <img src="/brand/cup.png" alt="" className="size-9 object-contain brightness-0 invert" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">Postaw kawę</h2>
                  <p className="mt-0.5 text-sm leading-snug text-muted">{COFFEE_COPY.kicker}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openExternal(CUPLINK)}
                className="tap mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-coffee pl-4 pr-3.5 text-sm font-semibold text-coffee-fg"
              >
                <CoffeeIcon size={18} />
                Postaw kawę
              </button>
            </section>

            <button
              type="button"
              onClick={() => openExternal(INSTAGRAM)}
              className="tap flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-border"
              aria-label="Instagram Method Feeder Szczecin"
            >
              <img
                src="/brand/logo-karp-circle.png"
                alt=""
                className="size-12 shrink-0 rounded-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">Method Feeder Szczecin</span>
                <span className="mt-0.5 block text-xs text-muted">Instagram</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-muted">
                <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 14 19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M17 13.5V19H5V7h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {COFFEE_SECTIONS.map((block) => (
              <section key={block[0].slice(0, 28)} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                <div className="space-y-2.5 text-sm leading-relaxed text-muted">
                  {block.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}

export function SpeciesWaters() {
  const id = useAtlas((s) => s.selectedSpeciesId);
  const setScreen = useAtlas((s) => s.setScreen);
  const catalogReady = useAtlas((s) => s.catalogReady);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sp = SPECIES.find((s) => s.id === id);
  const list = useMemo(() => {
    if (!id || !catalogReady) return [];
    return watersForSpecies(id);
  }, [id, catalogReady]);
  const onOpen = useCallback((wid: string) => {
    useAtlas.getState().openSpot(wid, "species-waters");
  }, []);
  return (
    <ScreenFrame ref={scrollRef} onBack={() => setScreen("ryby")}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BackBtn onClick={() => setScreen("ryby")} />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">
                {sp?.name ?? "Gatunek"}{" "}
                <span className="tabular-nums text-muted">({list.length})</span>
              </h1>
              {sp && <p className="text-xs italic text-muted">{sp.latin}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => openExternal(CUPLINK)}
            className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg"
            aria-label="Postaw kawę"
          >
            <CoffeeIcon size={18} />
          </button>
        </header>
        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <div className="mt-4">
          {list.length > 0 ? (
            <WaterFeed
              waters={list}
              onOpen={onOpen}
              rootRef={scrollRef}
            />
          ) : catalogReady ? (
            <EmptyState
              icon={<FishOutline size={26} />}
              title="Brak łowisk"
              body="Ten gatunek nie jest przypisany do żadnego łowiska w atlasie."
              action={() => setScreen("ryby")}
              actionLabel="Wróć do ryb"
            />
          ) : (
            <FeedSkeleton />
          )}
        </div>
        <p className="mt-6 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}

export function HostWaters() {
  const key = useAtlas((s) => s.selectedHostKey);
  const hostFrom = useAtlas((s) => s.hostFrom);
  const setScreen = useAtlas((s) => s.setScreen);
  const catalogReady = useAtlas((s) => s.catalogReady);
  const list = useMemo(() => {
    if (!key || !catalogReady) return [];
    return watersOfHost(key);
  }, [key, catalogReady]);
  const label = list[0] ? hostGroupOf(list[0]).label : key ? labelOfHostKey(key) : "Gospodarz";
  const mgr = key ? managerFromHostKey(key) : null;
  const hostStock = mgr ? stockingOfManager(mgr.id) : null;
  const web = safeHttpUrl(mgr?.website);
  const social = safeHttpUrl(mgr?.socialUrl);
  const permit = safeHttpUrl(mgr?.permitUrl);
  const socialBtn = social && social !== web ? social : null;
  const goBack = () => {
    const to = hostFrom && hostFrom !== "host-waters" && hostFrom !== "spot" ? hostFrom : "map";
    setScreen(to);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const onOpen = useCallback((wid: string) => {
    useAtlas.getState().openSpot(wid, "host-waters");
  }, []);
  return (
    <ScreenFrame ref={scrollRef} onBack={goBack}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BackBtn onClick={goBack} />
            <h1 className="min-w-0 text-lg font-semibold">
              {label}{" "}
              <span className="tabular-nums text-muted">({list.length})</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => openExternal(CUPLINK)}
            className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg"
            aria-label="Postaw kawę"
          >
            <CoffeeIcon size={18} />
          </button>
        </header>
        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        {mgr && (web || socialBtn || permit) && (
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
            {permit && <OutLink href={permit}>{mgr.permitLabel ?? "Zezwolenie"}</OutLink>}
          </div>
        )}
        {hostStock && (
          <section className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Zarybienie</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {hostStock.summary}
            </p>
            <div className="mt-2">
              <OutLink href={hostStock.url} tone="secondary">
                {hostStock.label}
              </OutLink>
            </div>
          </section>
        )}
        <div className="mt-4">
          {list.length > 0 ? (
            <WaterFeed
              waters={list}
              onOpen={onOpen}
              rootRef={scrollRef}
            />
          ) : catalogReady ? (
            <EmptyState
              icon={<FishOutline size={26} />}
              title="Brak łowisk"
              body="Ten gospodarz nie ma innych wpisów w atlasie."
              action={goBack}
              actionLabel="Wróć"
            />
          ) : (
            <FeedSkeleton />
          )}
        </div>
        <p className="mt-6 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}

function TarloNotify() {
  const [on, setOn] = useState(() => tarloPref());
  const [msg, setMsg] = useState("");
  return (
    <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <h2 className="font-semibold">Powiadomienie o tarle</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Gdy okres ochronny kończy się dziś albo jutro, atlas wysyła powiadomienie.
        Na iPhonie: zapisz na ekranie początkowym (Safari → Udostępnij), włącz zgody.
        Serwer dopina Web Push rano (cron) — karta nie musi być otwarta.
      </p>
      <button
        type="button"
        onClick={async () => {
          const next = !on;
          const res = await setTarloPref(next);
          if (res === "denied") {
            setMsg("Brak zgody na powiadomienia w systemie.");
            setOn(false);
            return;
          }
          if (res === "unsupported") {
            setMsg("Ta przeglądarka nie obsługuje powiadomień.");
            setOn(false);
            return;
          }
          setOn(next);
          setMsg(next ? "Włączone. Dostaniesz sygnał, gdy ochrona się kończy." : "Wyłączone.");
        }}
        className={cn(
          "tap mt-3 min-h-11 w-full rounded-full text-sm font-semibold",
          on ? "bg-primary text-primary-foreground" : "bg-card-2 ring-1 ring-border",
        )}
      >
        {on ? "Powiadomienia włączone" : "Włącz powiadomienia"}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-muted">{msg}</p>}
    </section>
  );
}

function HydroNotify() {
  const [on, setOn] = useState(() => hydroPref());
  const [msg, setMsg] = useState("");
  return (
    <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <h2 className="font-semibold">Stany rzek IMGW</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Gdy Odra, Rega, Drawa, Parsęta, Ina, Płonia albo Wieprza skoczą o 30 cm
        i więcej, atlas wyśle powiadomienie. Sprawdzamy rano i po południu.
      </p>
      <button
        type="button"
        onClick={async () => {
          const next = !on;
          const res = await setHydroPref(next);
          if (res === "denied") {
            setMsg("Brak zgody na powiadomienia w systemie.");
            setOn(false);
            return;
          }
          if (res === "unsupported") {
            setMsg("Ta przeglądarka nie obsługuje powiadomień.");
            setOn(false);
            return;
          }
          setOn(next);
          setMsg(next ? "Włączone. Dostaniesz sygnał przy skoku stanu." : "Wyłączone.");
        }}
        className={cn(
          "tap mt-3 min-h-11 w-full rounded-full text-sm font-semibold",
          on ? "bg-primary text-primary-foreground" : "bg-card-2 ring-1 ring-border",
        )}
      >
        {on ? "Stany IMGW włączone" : "Włącz stany IMGW"}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-muted">{msg}</p>}
    </section>
  );
}

function LicensesBlock({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
        <h2 className="font-semibold">{LICENSES_COPY.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{LICENSES_COPY.lead}</p>
      </section>
      {LICENSES_COPY.groups.map((g) => (
        <section key={g.title} className="rounded-2xl bg-card p-3 ring-1 ring-border">
          <h2 className="font-semibold">{g.title}</h2>
          <ul className="mt-3 space-y-3">
            {g.items.map((it) => (
              <li key={it.t}>
                <p className="text-sm font-semibold text-foreground">{it.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{it.d}</p>
                <button
                  type="button"
                  onClick={() => openExternal(it.href)}
                  className="mt-1 text-xs font-semibold text-primary underline decoration-primary/40 underline-offset-2"
                >
                  Źródło
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function InstallPage() {
  const back = useAtlas((s) => s.back);
  return (
    <ScreenFrame onBack={back}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <div className="flex min-w-0 items-center gap-2">
          <BackBtn onClick={back} />
          <h1 className="min-w-0 text-lg font-semibold leading-tight">Dodaj do ekranu startowego</h1>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <div className="mt-4 space-y-3">
          <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
            <h2 className="font-semibold">iPhone</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
              {INSTALL_COPY.ios.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
          <section className="rounded-2xl bg-card p-3 ring-1 ring-border">
            <h2 className="font-semibold">Android</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
              {INSTALL_COPY.android.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
          <LicensesBlock />
        </div>
        <p className="mt-6 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}
