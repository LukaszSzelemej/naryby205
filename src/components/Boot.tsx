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
    setLeaving(true);
    void Promise.all([
      import("@/components/App"),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 160);
      }),
    ]).then(() => {
      setAppOn(true);
      finishBoot();
      setLeaving(false);
    });
  }, [finishBoot]);

  return (
    <div className="relative h-full">
      {appOn && (
        <Suspense fallback={null}>
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
