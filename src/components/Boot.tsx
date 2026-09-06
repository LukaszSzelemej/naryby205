import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { loadCatalog } from "@/lib/catalog";
import { markLoaderSeen } from "@/lib/storage";
import { useAtlas } from "@/lib/store";
import { cn } from "@/lib/utils";

const App = lazy(() => import("@/components/App").then((m) => ({ default: m.App })));

export function Boot() {
  const booting = useAtlas((s) => s.booting);
  const bootKey = useAtlas((s) => s.bootKey);
  const finishBoot = useAtlas((s) => s.finishBoot);
  const [appOn, setAppOn] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    void loadCatalog();
    void import("@/components/App");
  }, []);

  const onDone = useCallback(() => {
    markLoaderSeen();
    setAppOn(true);
    setLeaving(true);
    window.setTimeout(() => {
      finishBoot();
      setLeaving(false);
    }, 180);
  }, [finishBoot]);

  return (
    <div className="relative h-full">
      {appOn && (
        <Suspense fallback={<div className="h-full bg-background" />}>
          <App />
        </Suspense>
      )}
      {(booting || leaving) && (
        <div className={cn("absolute inset-0 z-50", leaving && "loader-leave")}>
          <Loader key={bootKey} replay={bootKey > 0} online={1} onDone={onDone} />
        </div>
      )}
    </div>
  );
}
