import { WaterCard } from "@/components/SpotList";
import { WATERS_BY_ID } from "@/lib/catalog";
import { useAtlas } from "@/lib/store";

export function MapSheet() {
  const sheet = useAtlas((s) => s.sheet);
  const close = useAtlas((s) => s.closeSheet);
  const openSpot = useAtlas((s) => s.openSpot);
  if (!sheet) return null;
  const rows = sheet.ids.map((id) => WATERS_BY_ID[id]).filter(Boolean);
  return (
    <div className="absolute inset-x-0 bottom-[var(--down-h)] z-40 px-2 pb-1">
      <div className="mx-auto max-h-[42vh] max-w-lg overflow-y-auto rounded-2xl bg-card p-3 shadow-lg ring-1 ring-border">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{sheet.title}</h2>
          <button
            type="button"
            onClick={close}
            className="tap min-h-9 rounded-full bg-card-2 px-3 text-xs font-semibold ring-1 ring-border"
          >
            Zamknij
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted">Brak łowisk w tym zestawie.</p>
        ) : (
          <div className="grid gap-2">
            {rows.map((w) => (
              <WaterCard key={w.id} w={w} onOpen={(id) => openSpot(id, "map")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
