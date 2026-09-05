import { useMemo, useState } from "react";
import { BookGlyph, CoffeeIcon, SearchGlyph } from "@/components/icons";
import {
  CUPLINK,
  DISCLAIMER,
  KIND_LABEL,
  METHOD_LABEL,
  SPECIES,
  speciesName,
  WATERS,
  WATERS_BY_ID,
  formatDistance,
  haversineKm,
  searchWaters,
} from "@/lib/catalog";
import { useAtlas } from "@/lib/store";
import { cn, openExternal } from "@/lib/utils";
import { EmptyState, ScreenFrame } from "@/components/States";

const METHODS = Object.keys(METHOD_LABEL).sort((a, b) =>
  (METHOD_LABEL[a] ?? a).localeCompare(METHOD_LABEL[b] ?? b, "pl"),
);

function parsePositive(raw: string) {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function WaterPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const geo = useAtlas((s) => s.geo);
  const favs = useAtlas((s) => s.favorites);
  const selected = WATERS_BY_ID[value];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(!selected);

  const hits = useMemo(() => {
    const query = q.trim();
    if (query) return searchWaters(query).slice(0, 12);
    const favSet = new Set(favs);
    const ranked = WATERS.map((w) => {
      let score = 0;
      if (favSet.has(w.id)) score += 10_000;
      if (w.featured) score += 400;
      if (typeof w.areaHa === "number") score += Math.min(w.areaHa, 2000);
      if (geo) score += Math.max(0, 250 - haversineKm(geo.lat, geo.lng, w.lat, w.lng) * 4);
      return { w, score };
    });
    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, 8).map((x) => x.w);
  }, [q, geo, favs]);

  return (
    <div className="block text-xs text-muted">
      Miejsce połowu
      {selected && !open ? (
        <div className="mt-1 flex items-center gap-2 rounded-xl bg-card-2 px-3 py-2 ring-1 ring-border">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{selected.name}</p>
            <p className="truncate text-xs text-muted">
              {KIND_LABEL[selected.kind]} · {selected.powiat}
            </p>
          </div>
          <button
            type="button"
            className="tap shrink-0 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
            onClick={() => {
              setOpen(true);
              setQ("");
            }}
          >
            Zmień
          </button>
        </div>
      ) : (
        <div className="mt-1">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-faint">
              <SearchGlyph size={16} />
            </span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (!open) setOpen(true);
              }}
              placeholder="Szukaj łowiska po nazwie…"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="search"
              className="min-h-11 w-full rounded-xl bg-card-2 py-2 pr-10 pl-10 text-sm text-foreground"
            />
            {q.length > 0 && (
              <button
                type="button"
                aria-label="Wyczyść"
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-lg leading-none text-muted"
                onClick={() => setQ("")}
              >
                ×
              </button>
            )}
          </div>
          <ul className="mt-1.5 overflow-hidden rounded-xl bg-card-2 ring-1 ring-border">
            {hits.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted">
                {q.trim().length >= 2 ? `Brak łowiska dla „${q.trim()}”.` : "Wpisz nazwę jeziora, rzeki albo stawu."}
              </li>
            ) : (
              hits.map((w) => {
                const on = w.id === value;
                const dist =
                  geo != null ? formatDistance(haversineKm(geo.lat, geo.lng, w.lat, w.lng)) : null;
                return (
                  <li key={w.id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col items-start px-3 py-2.5 text-left",
                        on ? "bg-primary/15" : "hover:bg-card",
                      )}
                      onClick={() => {
                        onChange(w.id);
                        setQ("");
                        setOpen(false);
                      }}
                    >
                      <span className="text-sm font-medium text-foreground">{w.name}</span>
                      <span className="text-xs text-muted">
                        {KIND_LABEL[w.kind]} · {w.powiat}
                        {dist ? ` · ${dist}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {selected && (
            <button
              type="button"
              className="tap mt-1.5 text-xs font-semibold text-primary"
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
            >
              Zostaw {selected.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Journal() {
  const rows = useAtlas((s) => s.journal);
  const add = useAtlas((s) => s.addCatch);
  const remove = useAtlas((s) => s.removeCatch);
  const openSpot = useAtlas((s) => s.openSpot);
  const selectedId = useAtlas((s) => s.selectedId);
  const [open, setOpen] = useState(false);
  const [speciesId, setSpeciesId] = useState(SPECIES[0]?.id ?? "szczupak");
  const [waterId, setWaterId] = useState(() =>
    selectedId && WATERS_BY_ID[selectedId] ? selectedId : "",
  );
  const [method, setMethod] = useState("method feeder");
  const [lengthCm, setLengthCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [note, setNote] = useState("");
  const [killId, setKillId] = useState<string | null>(null);
  const [waterErr, setWaterErr] = useState(false);

  const speciesSorted = useMemo(
    () => [...SPECIES].sort((a, b) => a.name.localeCompare(b.name, "pl")),
    [],
  );

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-lg px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Dziennik</h1>
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
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setWaterErr(false);
          }}
          className="tap mt-4 min-h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {open ? "Anuluj" : "Dodaj połów"}
        </button>
        {open && (
            <form
              className="mt-3 space-y-3 rounded-2xl bg-card p-3 ring-1 ring-border"
              onSubmit={(e) => {
                e.preventDefault();
                if (!waterId || !WATERS_BY_ID[waterId]) {
                  setWaterErr(true);
                  return;
                }
                add({
                  id: crypto.randomUUID(),
                  speciesId,
                  waterId,
                  method,
                  lengthCm: parsePositive(lengthCm),
                  weightKg: parsePositive(weightKg),
                  note: note.trim() || undefined,
                  createdAt: new Date().toISOString(),
                });
                setOpen(false);
                setWaterErr(false);
                setNote("");
                setLengthCm("");
                setWeightKg("");
              }}
            >
              <label className="block text-xs text-muted">
                Gatunek
                <select
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl bg-card-2 px-3 text-sm text-foreground"
                >
                  {speciesSorted.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted">
                Metoda
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl bg-card-2 px-3 text-sm text-foreground"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </option>
                  ))}
                </select>
              </label>
              <WaterPicker
                value={waterId}
                onChange={(id) => {
                  setWaterId(id);
                  setWaterErr(false);
                }}
              />
              {waterErr && (
                <p className="text-xs font-medium text-danger">Wybierz łowisko z listy — nie da się zapisać bez miejsca połowu.</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-muted">
                  Wymiar (cm)
                  <input
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    inputMode="decimal"
                    className="mt-1 min-h-11 w-full rounded-xl bg-card-2 px-3 text-sm text-foreground"
                  />
                </label>
                <label className="block text-xs text-muted">
                  Waga (kg)
                  <input
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    inputMode="decimal"
                    className="mt-1 min-h-11 w-full rounded-xl bg-card-2 px-3 text-sm text-foreground"
                  />
                </label>
              </div>
              <label className="block text-xs text-muted">
                Notatka
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl bg-card-2 px-3 text-sm text-foreground"
                />
              </label>
              <button
                type="submit"
                className="tap min-h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                Zapisz
              </button>
            </form>
        )}
        <div className="mt-4 space-y-2">
          {rows.length === 0 && !open && (
            <EmptyState
              icon={<BookGlyph size={26} />}
              title="Dziennik jest pusty"
              body="Zapisz pierwszy połów przyciskiem powyżej — gatunek, łowisko i wymiar zostają na tym telefonie."
            />
          )}
          {rows.map((r) => (
            <article key={r.id} className="water-card rounded-2xl bg-card p-3 ring-1 ring-border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{speciesName(r.speciesId)}</p>
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={() => openSpot(r.waterId, "journal")}
                  >
                    {WATERS_BY_ID[r.waterId]?.name ?? r.waterId}
                  </button>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(r.createdAt).toLocaleString("pl-PL")}
                    {r.method ? ` · ${METHOD_LABEL[r.method] ?? r.method}` : ""}
                    {r.lengthCm ? ` · ${r.lengthCm} cm` : ""}
                    {r.weightKg ? ` · ${r.weightKg} kg` : ""}
                  </p>
                  {r.note && <p className="mt-1 text-xs">{r.note}</p>}
                </div>
                <button
                  type="button"
                  className={cn(
                    "tap min-h-8 rounded-full px-2 text-xs",
                    killId === r.id ? "bg-danger/15 font-semibold text-danger" : "text-danger",
                  )}
                  onClick={() => {
                    if (killId === r.id) {
                      remove(r.id);
                      setKillId(null);
                    } else setKillId(r.id);
                  }}
                >
                  {killId === r.id ? "Potwierdź" : "Usuń"}
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-faint">{DISCLAIMER}</p>
      </div>
    </ScreenFrame>
  );
}
