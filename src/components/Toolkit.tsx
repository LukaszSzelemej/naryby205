import { useMemo, useState } from "react";
import { CoffeeIcon, FishOutline, SearchGlyph } from "@/components/icons";
import { WaterCard } from "@/components/SpotList";
import { BackBtn, OutLink, PhoneText, TelBtn } from "@/components/Chrome";
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
  safeHttpUrl,
  SPECIES,
  SPECIES_LETTERS,
  sanitizeQuery,
  watersForSpecies,
  watersOfHost,
  hostGroupOf,
  foldPl,
} from "@/lib/catalog";
import {
  COFFEE_COPY,
  COOKIES_TEXT,
  DOKUMENTY,
  ETYKIETA,
  INSTALL_COPY,
  LICENSES_COPY,
  OFFLINE_COPY,
  PORADNIK,
  ZAPIS_COPY,
} from "@/lib/content";
import { useAtlas } from "@/lib/store";
import { setTarloPref, tarloPref } from "@/lib/tarlo";
import { cn, openExternal, phonesIn } from "@/lib/utils";
import { clearOffline, downloadOffline, offlineCount } from "@/lib/offline";
import { EmptyState, Meter, ScreenFrame } from "@/components/States";

const TABS: { id: NonNullable<ReturnType<typeof tabId>>; label: string; alwaysOrange?: boolean }[] = [
  { id: "gatunki", label: "Gatunki" },
  { id: "dokumenty", label: "Dokumenty" },
  { id: "etykieta", label: "Etykieta" },
  { id: "poradnik", label: "Poradnik" },
  { id: "offline", label: "Mapa offline" },
  { id: "zapis", label: "Zapis" },
  { id: "ciasteczka", label: "Ciasteczka" },
  { id: "kawa", label: "Postaw kawę", alwaysOrange: true },
];

function tabId(): "gatunki" | "dokumenty" | "etykieta" | "poradnik" | "offline" | "zapis" | "ciasteczka" | "kawa" {
  return "gatunki";
}

export function Toolkit() {
  const tab = useAtlas((s) => s.kitTab) ?? "gatunki";
  const setTab = useAtlas((s) => s.setKitTab);
  const letter = useAtlas((s) => s.letter);
  const setLetter = useAtlas((s) => s.setLetter);
  const setSpecies = (id: string) => {
    useAtlas.setState({ selectedSpeciesId: id, screen: "species-waters", prevScreen: "kit" });
  };
  const [q, setQ] = useState("");
  const [offMsg, setOffMsg] = useState<string | null>(null);
  const [offPct, setOffPct] = useState<number | null>(null);
  const [offBusy, setOffBusy] = useState(false);

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
    <ScreenFrame>
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
                setLetter(null);
              }}
              className={cn(
                "tap min-h-11 rounded-xl px-1 text-xs font-semibold leading-tight",
                t.alwaysOrange
                  ? "bg-coffee text-coffee-fg"
                  : tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground ring-1 ring-border",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "gatunki" && (
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
                      onClick={() => setSpecies(s.id)}
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
        )}

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
            {Object.values(MANAGERS).map((m) => {
              const web = safeHttpUrl(m.website);
              const social = safeHttpUrl(m.socialUrl);
              const permit = safeHttpUrl(m.permitUrl);
              const socialBtn = social && social !== web ? social : null;
              const phones = phonesIn(m.priceNote, m.name);
              return (
              <article key={m.id} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                <p className="font-semibold">{m.shortName}</p>
                <p className="text-sm text-muted">{m.name}</p>
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
                    <OutLink href={permit}>
                      {m.permitLabel ?? "Zezwolenie"}
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
                  setOffMsg(`Gotowe · ${n} kafelków`);
                } catch {
                  setOffMsg("Nie udało się pobrać. Spróbuj na Wi‑Fi.");
                } finally {
                  setOffBusy(false);
                }
              }}
            >
              {offBusy && offPct != null ? `Pobieranie ${offPct}%` : "Pobierz mapę województwa"}
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
            <LicensesBlock />
          </div>
        )}

        {tab === "ciasteczka" && (
          <div className="kit-pane mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <h2 className="text-base font-semibold text-foreground">{COOKIES_TEXT.title}</h2>
            <p>{COOKIES_TEXT.intro}</p>
            <p>{COOKIES_TEXT.about}</p>
            <h3 className="font-semibold text-foreground">{COOKIES_TEXT.useTitle}</h3>
            <p>{COOKIES_TEXT.useLead}</p>
            {COOKIES_TEXT.items.map((it) => (
              <p key={it.t}>
                <span className="font-semibold text-foreground">{it.t}:</span> {it.d}
              </p>
            ))}
            <h3 className="font-semibold text-foreground">{COOKIES_TEXT.thirdTitle}</h3>
            <p>{COOKIES_TEXT.third}</p>
            <h3 className="font-semibold text-foreground">{COOKIES_TEXT.rightsTitle}</h3>
            <p>{COOKIES_TEXT.rights}</p>
            <h3 className="font-semibold text-foreground">{COOKIES_TEXT.safeTitle}</h3>
            <p>{COOKIES_TEXT.safe}</p>
            <ul className="space-y-1">
              {COOKIES_TEXT.how.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        )}

        {tab === "kawa" && (
          <div className="kit-pane mt-6 text-left">
            <button
              type="button"
              onClick={() => openExternal(CUPLINK)}
              className="coffee-glow mx-auto grid size-20 place-items-center rounded-full bg-coffee text-coffee-fg"
              aria-label="Postaw kawę"
            >
              <img src="/brand/cup.png" alt="" className="size-12 object-contain brightness-0 invert" />
            </button>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Postaw kawę</h2>
            <p className="mt-2 text-sm font-medium text-foreground">{COFFEE_COPY.kicker}</p>
            <button
              type="button"
              onClick={() => openExternal(INSTAGRAM)}
              className="seal-glow mx-auto mt-5 block size-20 rounded-full"
              aria-label="Instagram Method Feeder Szczecin"
            >
              <img
                src="/brand/logo-karp-circle.png"
                alt="Method Feeder Szczecin"
                className="size-full rounded-full object-cover"
              />
            </button>
            <p className="mt-5 text-sm leading-relaxed text-muted">{DISCLAIMER}</p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              {COFFEE_COPY.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
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
  const openSpot = useAtlas((s) => s.openSpot);
  useAtlas((s) => s.catalogReady);
  const sp = SPECIES.find((s) => s.id === id);
  const list = id ? watersForSpecies(id) : [];
  let last = "";
  return (
    <ScreenFrame>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BackBtn onClick={() => setScreen("kit")} />
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
        <div className="mt-4 space-y-2 list-rise">
          {list.map((w) => {
            const L = letterOf(w.name);
            const show = L !== last;
            last = L;
            return (
              <div key={w.id}>
                {show && (
                  <p className="mb-1 mt-3 text-xs font-semibold tracking-widest text-faint">{L}</p>
                )}
                <WaterCard w={w} onOpen={(wid) => openSpot(wid, "species-waters")} />
              </div>
            );
          })}
          {list.length === 0 && (
            <EmptyState
              icon={<FishOutline size={26} />}
              title="Brak łowisk"
              body="Ten gatunek nie jest przypisany do żadnego łowiska w atlasie."
              action={() => setScreen("kit")}
              actionLabel="Wróć do gatunków"
            />
          )}
        </div>
        <p className="mt-6 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}

export function HostWaters() {
  const key = useAtlas((s) => s.selectedHostKey);
  const back = useAtlas((s) => s.back);
  const openSpot = useAtlas((s) => s.openSpot);
  useAtlas((s) => s.catalogReady);
  const list = key ? watersOfHost(key) : [];
  const label = list[0] ? hostGroupOf(list[0]).label : "Gospodarz";
  let last = "";
  return (
    <ScreenFrame>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BackBtn onClick={back} />
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
        <div className="mt-4 space-y-2 list-rise">
          {list.map((w) => {
            const L = letterOf(w.name);
            const show = L !== last;
            last = L;
            return (
              <div key={w.id}>
                {show && (
                  <p className="mb-1 mt-3 text-xs font-semibold tracking-widest text-faint">{L}</p>
                )}
                <WaterCard w={w} onOpen={(wid) => openSpot(wid, "host-waters")} />
              </div>
            );
          })}
          {list.length === 0 && (
            <EmptyState
              icon={<FishOutline size={26} />}
              title="Brak łowisk"
              body="Ten gospodarz nie ma innych wpisów w atlasie."
              action={back}
              actionLabel="Wróć"
            />
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
        Gdy okres ochronny kończy się dziś albo jutro, atlas może wysłać powiadomienie na telefon —
        także bez otwartej karty, jeśli aplikacja jest zapisana na ekranie i system pozwala na
        tło (Chrome na Androidzie).
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

function LicensesBlock({ className }: { className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card p-3 ring-1 ring-border", className)}>
      <h2 className="font-semibold">{LICENSES_COPY.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{LICENSES_COPY.lead}</p>
      <ul className="mt-3 space-y-3">
        {LICENSES_COPY.items.map((it) => (
          <li key={it.t}>
            <p className="text-sm font-semibold text-foreground">{it.t}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{it.d}</p>
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
  );
}

export function InstallPage() {
  const back = useAtlas((s) => s.back);
  return (
    <ScreenFrame>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <div className="flex min-w-0 items-center gap-2">
          <BackBtn onClick={back} />
          <h1 className="min-w-0 text-lg font-semibold leading-tight">Dodaj do ekranu startowego</h1>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <section className="mt-4 rounded-2xl bg-card p-3 ring-1 ring-border">
          <h2 className="font-semibold">iPhone</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted">
            {INSTALL_COPY.ios.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
        <section className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
          <h2 className="font-semibold">Android</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted">
            {INSTALL_COPY.android.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
        <LicensesBlock className="mt-3" />
        <p className="mt-6 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}
