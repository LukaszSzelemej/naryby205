import { useEffect } from "react";
import { App } from "@/components/App";
import { Loader } from "@/components/Loader";
import { loadCatalog } from "@/lib/catalog";
import { registerAtlasSw } from "@/lib/offline";
import { bootTarlo } from "@/lib/tarlo";
import { useAtlas } from "@/lib/store";

export function Boot() {
  const booting = useAtlas((s) => s.booting);
  const bootKey = useAtlas((s) => s.bootKey);
  const finishBoot = useAtlas((s) => s.finishBoot);

  useEffect(() => {
    void loadCatalog();
    void bootTarlo();
    const later = window.setTimeout(() => void registerAtlasSw(), 2000);
    return () => window.clearTimeout(later);
  }, []);

  return (
    <div className="relative h-full">
      <App />
      {booting ? (
        <div className="absolute inset-0 z-50">
          <Loader key={bootKey} replay online={1} onDone={finishBoot} />
        </div>
      ) : null}
    </div>
  );
}
