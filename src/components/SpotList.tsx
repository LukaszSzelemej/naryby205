import { useEffect, useMemo, useRef, useState } from "react";
import { CoffeeIcon, FishOutline, SearchGlyph, StarGlyph } from "@/components/icons";
import { SearchField, requestLocation } from "@/components/Chrome";
import { EmptyState, FeedSkeleton, ScreenFrame } from "@/components/States";
import {
  ALPHABET,
  categoryTags,
  CUPLINK,
  DISCLAIMER,
  FILTER_META,
  formatDepth,
  formatDistance,
  formatSize,
  haversineKm,
  letterOf,
  LIST_CATEGORIES,
  MAP_SPECIES,
  SPECIES_BY_ID,
  matchesFilter,
  matchesObwod,
  retryCatalog,
  allObwody,
  classifyObwod,
  obwodLabel,
  sanitizeQuery,
  searchWaters,
  sortName,
  speciesName,
  waterTitle,
  WATERS,
} from "@/lib/catalog";
import { useAtlas } from "@/lib/store";
import type { MapFilter, SortMode, Water } from "@/lib/types";
import { cn, openExternal } from "@/lib/utils";

function CoffeeLink() {
  return (
    <button
      type="button"
      onClick={() => openExternal(CUPLINK)}
      aria-label="Postaw kawę"
      className="tap grid size-10 place-items-center rounded-full bg-coffee text-coffee-fg coffee-glow"
    >
      <CoffeeIcon size={18} />
    </button>
  );
}

export function WaterCard({ w, onOpen }: { w: Water; onOpen: (id: string) => void }) {
  const geo = useAtlas((s) => s.geo);
  const favs = useAtlas((s) => s.favorites);
  const toggleFav = useAtlas((s) => s.toggleFav);
  const dist =
    geo != null ? formatDistance(haversineKm(geo.lat, geo.lng, w.lat, w.lng)) : null;
  const size = formatSize(w);
  const depth = formatDepth(w);
  const fish = [...new Set(w.species)]
    .map(speciesName)
    .sort((a, b) => a.localeCompare(b, "pl"))
    .join(", ");
  const on = favs.includes(w.id);
  return (
    <article className="water-card relative rounded-2xl bg-card p-3 pr-10 ring-1 ring-border">
      <button
        type="button"
        onClick={() => toggleFav(w.id)}
        className="star-btn absolute top-2.5 right-2.5 text-warn"
        aria-label={on ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      >
        <StarGlyph size={20} filled={on} />
      </button>
      <button type="button" onClick={() => onOpen(w.id)} className="block w-full text-left">
        <p className="text-xs font-medium text-primary">{categoryTags(w).join(" · ")}</p>
        <h3 className="mt-0.5 text-base font-semibold text-foreground">{waterTitle(w)}</h3>
        <p className="mt-1 text-xs text-muted">
          {[w.gmina, w.powiat, dist].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-xs text-muted">
          {[size, depth ? `gł. ${depth}` : null].filter(Boolean).join(" · ") || "—"}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-faint">{fish}</p>
      </button>
    </article>
  );
}

function passes(w: Water, host: MapFilter, kind: MapFilter, favOnly: boolean, favSet: Set<string>) {
  if (host !== "all" && !matchesFilter(w, host, favSet)) return false;
  if (kind !== "all" && !matchesFilter(w, kind, favSet)) return false;
  if (favOnly && !favSet.has(w.id)) return false;
  return true;
}

export function SpotList() {
  const listHost = useAtlas((s) => s.listHost);
  const listKind = useAtlas((s) => s.listKind);
  const listFavOnly = useAtlas((s) => s.listFavOnly);
  const setListFilter = useAtlas((s) => s.setListFilter);
  const listSpecies = useAtlas((s) => s.listSpecies);
  const setListSpecies = useAtlas((s) => s.setListSpecies);
  const listObwod = useAtlas((s) => s.listObwod);
  const setListObwod = useAtlas((s) => s.setListObwod);
  const listNight = useAtlas((s) => s.listNight);
  const setListNight = useAtlas((s) => s.setListNight);
  const listBoats = useAtlas((s) => s.listBoats);
  const setListBoats = useAtlas((s) => s.setListBoats);
  const letter = useAtlas((s) => s.letter);
  const setLetter = useAtlas((s) => s.setLetter);
  const sort = useAtlas((s) => s.sort);
  const setSort = useAtlas((s) => s.setSort);
  const q = useAtlas((s) => s.listQuery);
  const setQ = useAtlas((s) => s.setListQuery);
  const geo = useAtlas((s) => s.geo);
  const favs = useAtlas((s) => s.favorites);
  const openSpot = useAtlas((s) => s.openSpot);
  const screen = useAtlas((s) => s.screen);
  const setScreen = useAtlas((s) => s.setScreen);
  const catalogReady = useAtlas((s) => s.catalogReady);
  const catalogError = useAtlas((s) => s.catalogError);

  const tabScope: MapFilter =
    screen === "pzw" ? "pzw" : screen === "specjalne" ? "specjalne" : "all";
  const host: MapFilter = tabScope !== "all" ? tabScope : listHost;
  const favSet = useMemo(() => new Set(favs), [favs]);

  const heading = listFavOnly
    ? "Ulubione"
    : listKind !== "all"
      ? (FILTER_META[listKind]?.label ?? "Łowiska")
      : host !== "all"
        ? (FILTER_META[host]?.label ?? "Łowiska")
        : screen === "pzw"
          ? "PZW"
          : screen === "specjalne"
            ? "Specjalne"
            : "Łowiska";

  const tabPool = useMemo(() => {
    if (tabScope === "all") return WATERS;
    return WATERS.filter((w) => matchesFilter(w, tabScope, favSet));
  }, [tabScope, favSet, catalogReady]);

  const catCount = useMemo(() => {
    const m: Partial<Record<MapFilter, number>> = { all: tabPool.length };
    for (const c of LIST_CATEGORIES) {
      if (c.id === "all") continue;
      if (c.id === "ulubione") {
        m[c.id] = tabPool.filter((w) =>
          passes(w, host, listKind, true, favSet),
        ).length;
        continue;
      }
      if (c.id === "pzw" || c.id === "specjalne" || c.id === "prywatne") {
        m[c.id] = tabPool.filter((w) =>
          passes(w, c.id, listKind, listFavOnly, favSet),
        ).length;
        continue;
      }
      m[c.id] = tabPool.filter((w) =>
        passes(w, host, c.id, listFavOnly, favSet),
      ).length;
    }
    return m;
  }, [tabPool, favSet, host, listKind, listFavOnly]);

  const scoped = useMemo(
    () =>
      tabPool.filter((w) => {
        if (!passes(w, host, listKind, listFavOnly, favSet)) return false;
        if (listSpecies.length && !listSpecies.every((id) => w.species.includes(id))) return false;
        if (!matchesObwod(w, listObwod)) return false;
        if (listNight && !w.night) return false;
        if (listBoats && !w.boats) return false;
        return true;
      }),
    [tabPool, host, listKind, listFavOnly, favSet, listSpecies, listObwod, listNight, listBoats],
  );

  const kindPool = useMemo(
    () => tabPool.filter((w) => passes(w, host, listKind, listFavOnly, favSet)),
    [tabPool, host, listKind, listFavOnly, favSet],
  );
  const kindObwodSet = useMemo(() => new Set(allObwody(kindPool)), [kindPool]);
  const anyKindObwod = kindObwodSet.size > 0;
  const kindSpecies = useMemo(() => {
    const s = new Set<string>();
    for (const w of kindPool) {
      for (const id of w.species ?? []) s.add(id);
    }
    return s;
  }, [kindPool]);

  useEffect(() => {
    if (!catalogReady) return;
    const cur = useAtlas.getState().listObwod;
    if (!cur.trim()) return;
    if (kindPool.some((w) => matchesObwod(w, cur))) return;
    setListObwod("");
  }, [catalogReady, host, listKind, listFavOnly, tabScope, kindPool, setListObwod]);

  useEffect(() => {
    if (!catalogReady) return;
    const cur = useAtlas.getState().listSpecies;
    if (!cur.length) return;
    const next = cur.filter((id) => kindSpecies.has(id));
    if (next.length === cur.length) return;
    useAtlas.setState({ listSpecies: next, letter: null });
  }, [catalogReady, kindSpecies]);

  const usedLetters = useMemo(() => {
    const set = new Set<string>();
    for (const w of scoped) set.add(letterOf(w.name));
    return set;
  }, [scoped]);

  const obwody = useMemo(() => allObwody(tabPool), [tabPool, catalogReady]);
  const categoryCount = scoped.length;

  const pool = useMemo(() => {
    const queried = q.trim() ? searchWaters(sanitizeQuery(q), scoped) : scoped;
    const lettered =
      letter && usedLetters.has(letter)
        ? queried.filter((w) => letterOf(w.name) === letter)
        : queried;
    const rows = [...lettered];
    const cmpAz = (a: Water, b: Water) =>
      sortName(a.name).localeCompare(sortName(b.name), "pl");
    if (sort === "az") rows.sort(cmpAz);
    else if (sort === "largest") {
      const rank = (w: Water): [number, number] => {
        const ha = typeof w.areaHa === "number" && w.areaHa > 0 ? w.areaHa : 0;
        const km = typeof w.lengthKm === "number" && w.lengthKm > 0 ? w.lengthKm : 0;
        if (ha > 0) return [1, ha];
        if (km > 0) return [0, km];
        return [-1, 0];
      };
      rows.sort((a, b) => {
        const [ga, va] = rank(a);
        const [gb, vb] = rank(b);
        return gb - ga || vb - va;
      });
    } else if (sort === "fav") {
      rows.sort((a, b) => Number(favSet.has(b.id)) - Number(favSet.has(a.id)) || cmpAz(a, b));
    } else if (sort === "nearest" && geo) {
      rows.sort(
        (a, b) =>
          haversineKm(geo.lat, geo.lng, a.lat, a.lng) -
          haversineKm(geo.lat, geo.lng, b.lat, b.lng),
      );
    } else rows.sort(cmpAz);
    return rows;
  }, [scoped, q, letter, sort, favSet, geo, usedLetters]);

  const [shown, setShown] = useState(160);
  const [rise, setRise] = useState(true);
  useEffect(() => {
    setShown(letter || q.trim() ? pool.length : 160);
  }, [host, listKind, listFavOnly, tabScope, q, letter, sort, pool.length, listSpecies, listObwod, listNight, listBoats]);
  useEffect(() => {
    const t = window.setTimeout(() => setRise(false), 700);
    return () => window.clearTimeout(t);
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown((n) => Math.min(pool.length, n + 160));
        }
      },
      { root, rootMargin: "600px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [pool.length]);
  const visible = letter || q.trim() ? pool : pool.slice(0, shown);

  const sorts: { id: SortMode; label: string }[] = [
    { id: "az", label: "A-Z" },
    { id: "largest", label: "Największe" },
    { id: "nearest", label: "Najbliższe" },
    { id: "fav", label: "Ulubione" },
  ];

  let lastLetter = "";

  const isOn = (id: MapFilter) => {
    if (id === "all") {
      return (
        listKind === "all" &&
        (host === tabScope || host === "all") &&
        !listFavOnly &&
        !listSpecies.length &&
        !listObwod.trim() &&
        !listNight &&
        !listBoats
      );
    }
    if (id === "ulubione") return listFavOnly;
    if (id === "pzw" || id === "specjalne" || id === "prywatne") return host === id;
    return listKind === id;
  };

  const clearFilters = () => {
    setListFilter("all");
    setLetter(null);
    setQ("");
  };

  const empty = (() => {
    if (!catalogReady) {
      if (catalogError) {
        return (
          <EmptyState
            icon={<FishOutline size={26} />}
            title="Nie udało się wczytać katalogu"
            body="Sprawdź połączenie i spróbuj ponownie."
            action={() => void retryCatalog()}
            actionLabel="Spróbuj ponownie"
          />
        );
      }
      return <FeedSkeleton />;
    }
    if (pool.length > 0) return null;
    if (q.trim()) {
      return (
        <EmptyState
          icon={<SearchGlyph size={26} />}
          title="Nic nie pasuje"
          body={`Nie znaleziono łowiska dla „${q.trim()}”. Sprawdź pisownię albo wyczyść wyszukiwanie.`}
          action={() => setQ("")}
          actionLabel="Wyczyść wyszukiwanie"
        />
      );
    }
    if (listFavOnly) {
      return (
        <EmptyState
          icon={<StarGlyph size={26} />}
          title="Brak ulubionych"
          body="Oznacz łowisko gwiazdką na liście albo na karcie — zapis zostaje na tym telefonie."
          action={clearFilters}
          actionLabel="Pokaż wszystkie"
        />
      );
    }
    if (letter) {
      return (
        <EmptyState
          icon={<FishOutline size={26} />}
          title={`Brak nazw na „${letter}”`}
          body="W tym filtrze nie ma łowiska na wybraną literę."
          action={() => setLetter(null)}
          actionLabel="Wyczyść literę"
        />
      );
    }
    return (
      <EmptyState
        icon={<FishOutline size={26} />}
        title="Pusto w tym zestawie"
        body="Żadne łowisko nie pasuje do wybranych filtrów. Zmień kategorię albo wróć do wszystkich."
        action={clearFilters}
        actionLabel="Wyczyść filtry"
      />
    );
  })();

  return (
    <ScreenFrame ref={scrollRef} onBack={() => setScreen("map")}>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">
            {heading}{" "}
            <span className="tabular-nums text-muted">({categoryCount})</span>
          </h1>
          <CoffeeLink />
        </header>
        <p className="mt-2 text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
        <div className="mt-3">
          <SearchField
            value={q}
            onChange={setQ}
            onPick={(id) => openSpot(id)}
            dark
            pool={scoped}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5 min-[400px]:grid-cols-4">
          {LIST_CATEGORIES.map((c) => {
            const n = catCount[c.id] ?? 0;
            const used = c.id === "all" || n > 0;
            const on = isOn(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={!used}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  if (!used) return;
                  setListFilter(c.id);
                }}
                className={cn(
                  "tap min-h-10 rounded-full px-1 text-center text-xs font-semibold leading-tight text-white",
                  !used
                    ? "cursor-not-allowed brightness-50"
                    : on
                      ? "ring-2 ring-white"
                      : "ring-1 ring-black/30",
                )}
                style={{ background: c.color }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5 min-[400px]:grid-cols-4">
          {MAP_SPECIES.map((id) => {
            const present = !catalogReady || kindSpecies.has(id);
            const on = present && listSpecies.includes(id);
            return (
              <button
                key={id}
                type="button"
                disabled={!present}
                onClick={() => {
                  if (!present) return;
                  setListSpecies(id);
                }}
                className={cn(
                  "tap min-h-10 rounded-full px-1 text-center text-xs font-semibold leading-tight ring-1",
                  !present
                    ? "cursor-not-allowed bg-card-2 text-faint ring-border opacity-40"
                    : on
                      ? "bg-card-2 text-foreground ring-white"
                      : "bg-card-2 text-foreground ring-border",
                )}
                aria-disabled={!present}
              >
                {SPECIES_BY_ID[id]?.name ?? id}
              </button>
            );
          })}
          <button
            type="button"
            onClick={setListNight}
            className={cn(
              "tap min-h-10 rounded-full px-1 text-center text-xs font-semibold leading-tight ring-1",
              listNight
                ? "bg-card-2 text-foreground ring-white"
                : "bg-card-2 text-foreground ring-border",
            )}
          >
            Noc
          </button>
          <button
            type="button"
            onClick={setListBoats}
            className={cn(
              "tap min-h-10 rounded-full px-1 text-center text-xs font-semibold leading-tight ring-1",
              listBoats
                ? "bg-card-2 text-foreground ring-white"
                : "bg-card-2 text-foreground ring-border",
            )}
          >
            Łodzie
          </button>
        </div>
        {obwody.length > 0 && (
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="sr-only">Numer koła lub obwodu</span>
              <input
                value={listObwod}
                onChange={(e) => {
                  if (!anyKindObwod) return;
                  setListObwod(sanitizeQuery(e.target.value));
                }}
                placeholder="Nr koła / obwodu, np. 86 albo J-89"
                inputMode="search"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={!anyKindObwod}
                aria-disabled={!anyKindObwod}
                className={cn(
                  "min-h-11 w-full rounded-full bg-card px-4 text-sm ring-1 ring-border outline-none placeholder:text-faint",
                  !anyKindObwod && "cursor-not-allowed opacity-40",
                )}
              />
            </label>
            {(["kolo", "jezioro", "rzeka"] as const).map((g) => {
              const items = obwody.filter((o) => classifyObwod(o) === g);
              if (!items.length) return null;
              const groupOn = items.some((o) => kindObwodSet.has(o));
              const title =
                g === "kolo" ? "Koła PZW" : g === "jezioro" ? "Jeziora J-" : "Rzeki R-";
              return (
                <div
                  key={g}
                  className={cn(!groupOn && "pointer-events-none opacity-40")}
                  aria-disabled={!groupOn}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                    {title}
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {items.map((o) => {
                      const chipOn = kindObwodSet.has(o);
                      const on =
                        chipOn &&
                        Boolean(listObwod.trim()) &&
                        matchesObwod({ obwod: [o] }, listObwod);
                      return (
                        <button
                          key={o}
                          type="button"
                          disabled={!chipOn}
                          onClick={() => {
                            if (!chipOn) return;
                            setListObwod(on ? "" : o);
                          }}
                          className={cn(
                            "tap min-h-8 shrink-0 rounded-full px-2.5 text-[11px] font-semibold tabular-nums ring-1",
                            !chipOn
                              ? "cursor-not-allowed bg-card-2 text-faint ring-border"
                              : on
                                ? "bg-card-2 text-foreground ring-white"
                                : "bg-card-2 text-foreground ring-border",
                          )}
                        >
                          {obwodLabel(o)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {sorts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSort(s.id);
                if (s.id === "nearest" && !useAtlas.getState().geo) requestLocation();
              }}
              className={cn(
                "tap min-h-10 rounded-full text-xs font-semibold ring-1",
                sort === s.id
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card text-foreground ring-border",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-1">
          {ALPHABET.map((row, i) => (
            <div key={i} className="grid grid-cols-10 gap-1">
              {row.map((L) => {
                const used = usedLetters.has(L);
                return (
                  <button
                    key={L}
                    type="button"
                    disabled={!used}
                    onClick={() => {
                      if (!used) return;
                      setLetter(letter === L ? null : L);
                    }}
                    className={cn(
                      "tap min-h-8 rounded-md text-xs font-semibold",
                      !used
                        ? "cursor-not-allowed bg-background text-faint/40 opacity-30"
                        : letter === L
                          ? "bg-primary text-primary-foreground"
                          : "bg-card-2 text-muted",
                    )}
                  >
                    {L}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className={cn("mt-4 space-y-2", rise && "list-rise")}>
          {visible.map((w) => {
            const L = letterOf(w.name);
            const show = L !== lastLetter;
            lastLetter = L;
            return (
              <div key={w.id}>
                {show && (
                  <p className="mb-1 mt-3 text-xs font-semibold tracking-widest text-faint">
                    {L}
                  </p>
                )}
                <WaterCard w={w} onOpen={(id) => openSpot(id)} />
              </div>
            );
          })}
          {empty}
          <div ref={sentinelRef} className="h-4" />
          {shown < pool.length && (
            <button
              type="button"
              className="tap mt-1 min-h-10 w-full rounded-full bg-card-2 text-sm font-medium text-muted"
              onClick={() => setShown((n) => Math.min(pool.length, n + 160))}
            >
              Pokaż kolejne ({pool.length - shown})
            </button>
          )}
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}
