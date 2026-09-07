import { useState } from "react";
import { SearchField, BackBtn } from "@/components/Chrome";
import { CoffeeIcon } from "@/components/icons";
import {
  categoryTags,
  CUPLINK,
  DISCLAIMER,
  formatDepth,
  formatSize,
  KIND_LABEL,
  managerOf,
  METHOD_LABEL,
  speciesName,
  waterTitle,
  WATERS,
  WATERS_BY_ID,
} from "@/lib/catalog";
import { useAtlas } from "@/lib/store";
import { openExternal } from "@/lib/utils";
import { ScreenFrame } from "@/components/States";
import type { Water } from "@/lib/types";

function Side({ w }: { w: Water }) {
  const mgr = managerOf(w);
  return (
    <article className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <p className="text-xs font-medium text-primary">{categoryTags(w).join(" · ")}</p>
      <h2 className="mt-0.5 text-base font-semibold">{waterTitle(w)}</h2>
      <p className="mt-1 text-xs text-muted">
        {[w.gmina, w.powiat].filter(Boolean).join(" · ")}
      </p>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div>
          <dt className="text-faint">Wielkość</dt>
          <dd>{formatSize(w) || "brak"}</dd>
        </div>
        <div>
          <dt className="text-faint">Głębokość</dt>
          <dd>{formatDepth(w) ?? "brak pomiaru"}</dd>
        </div>
        <div>
          <dt className="text-faint">Gospodarz</dt>
          <dd>{mgr.name}</dd>
        </div>
        <div>
          <dt className="text-faint">Gatunki</dt>
          <dd>{[...new Set(w.species)].map(speciesName).sort((a, b) => a.localeCompare(b, "pl")).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-faint">Metody</dt>
          <dd>{w.methods.map((m) => METHOD_LABEL[m] ?? m).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-faint">Noc / łodzie</dt>
          <dd>
            {w.night ? "noc" : "bez nocy"} · {w.boats ? "łodzie" : "bez łodzi"}
          </dd>
        </div>
        {w.obwod?.length ? (
          <div>
            <dt className="text-faint">Obwód</dt>
            <dd>{w.obwod.join(", ")}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export function ComparePage() {
  const aId = useAtlas((s) => s.compareA);
  const bId = useAtlas((s) => s.compareB);
  const setB = useAtlas((s) => s.setCompareB);
  const back = useAtlas((s) => s.back);
  const openSpot = useAtlas((s) => s.openSpot);
  useAtlas((s) => s.catalogReady);
  const a = aId ? WATERS_BY_ID[aId] : undefined;
  const b = bId ? WATERS_BY_ID[bId] : undefined;
  const [q, setQ] = useState("");

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-2xl px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BackBtn onClick={back} />
            <h1 className="text-lg font-semibold">Porównanie</h1>
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
        {!b && (
          <div className="mt-3">
            <p className="mb-2 text-sm text-muted">Wybierz drugie łowisko</p>
            <SearchField
              value={q}
              onChange={setQ}
              onPick={(id) => {
                setB(id);
                setQ("");
              }}
              dark
              autoFocus
              pool={aId ? WATERS.filter((w) => w.id !== aId) : WATERS}
            />
          </div>
        )}
        <div className="mt-3 grid gap-2 min-[520px]:grid-cols-2">
          {a ? (
            <button type="button" className="text-left" onClick={() => openSpot(a.id, "compare")}>
              <Side w={a} />
            </button>
          ) : (
            <p className="text-sm text-muted">Brak pierwszej karty.</p>
          )}
          {b ? (
            <button type="button" className="text-left" onClick={() => openSpot(b.id, "compare")}>
              <Side w={b} />
            </button>
          ) : (
            <p className="rounded-2xl bg-card p-3 text-sm text-muted ring-1 ring-border">
              Szukaj drugiego łowiska powyżej.
            </p>
          )}
        </div>
        {a && b && (
          <p className="mt-3 text-xs text-faint">
            {KIND_LABEL[a.kind]} vs {KIND_LABEL[b.kind]}
          </p>
        )}
      </div>
    </ScreenFrame>
  );
}
