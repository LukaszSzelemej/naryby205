import { useEffect, useState } from "react";
import { MapCanvas } from "@/components/MapCanvas";
import {
  ConsentBanner,
  CoordsBanner,
  CoffeeAsk,
  DownMenu,
  FilterBar,
  FishFab,
  MapSearch,
  OfflinePanel,
  OfflineReady,
  OnlinePill,
  RightMenu,
  requestLocation,
} from "@/components/Chrome";
import { SpotList } from "@/components/SpotList";
import { SpotDetail } from "@/components/SpotDetail";
import { Journal } from "@/components/Journal";
import { InstallPage, SpeciesWaters, HostWaters, Toolkit, SpeciesList, PermitsPage } from "@/components/Toolkit";
import { WeatherPage } from "@/components/WeatherPage";
import { ComparePage } from "@/components/Compare";
import { MapSheet } from "@/components/MapSheet";
import { MAP_CENTER, nearestTo, plWaters, retryCatalog } from "@/lib/catalog";
import { startPresence } from "@/lib/presence";
import { useAtlas } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";
import type { WeatherNow } from "@/lib/types";
import { loadConsent, loadFavorites, loadJournal, loadLastGeo, loadMapDark, loadPapers } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function App() {
  const screen = useAtlas((s) => s.screen);
  const filter = useAtlas((s) => s.filter);
  const catalogError = useAtlas((s) => s.catalogError);
  const openSpot = useAtlas((s) => s.openSpot);
  const openSheet = useAtlas((s) => s.openSheet);
  const nearbyPending = useAtlas((s) => s.nearbyPending);
  const catalogReady = useAtlas((s) => s.catalogReady);
  const geo = useAtlas((s) => s.geo);
  const consent = useAtlas((s) => s.consent);
  const papers = useAtlas((s) => s.papers);
  const [online, setOnline] = useState(1);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [vvPad, setVvPad] = useState(0);

  useEffect(() => {
    return startPresence(setOnline);
  }, []);

  useEffect(() => {
    useAtlas.setState({
      consent: loadConsent(),
      favorites: loadFavorites(),
      journal: loadJournal(),
      geo: loadLastGeo(),
      mapDark: loadMapDark(),
      papers: loadPapers(),
    });
  }, []);

  useEffect(() => {
    if (consent?.geo) requestLocation();
  }, [consent?.geo]);

  useEffect(() => {
    const lat = geo?.lat ?? MAP_CENTER[0];
    const lng = geo?.lng ?? MAP_CENTER[1];
    let live = true;
    fetchWeather(lat, lng).then((d) => {
      if (live) setWeather(d);
    });
    return () => {
      live = false;
    };
  }, [geo?.lat, geo?.lng, catalogReady]);

  useEffect(() => {
    if (!nearbyPending || !geo || !catalogReady) return;
    const ids = nearestTo(geo.lat, geo.lng, papers.length ? 8 : 5, papers).map((w) => w.id);
    openSheet({
      kind: "nearby",
      title: papers.length ? "Najbliższe · twoje zezwolenie" : "Najbliższe",
      ids,
    });
  }, [nearbyPending, geo, catalogReady, papers, openSheet]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setVvPad(gap > 40 ? gap : 0);
    };
    vv.addEventListener("resize", on);
    vv.addEventListener("scroll", on);
    on();
    return () => {
      vv.removeEventListener("resize", on);
      vv.removeEventListener("scroll", on);
    };
  }, []);

  useEffect(() => {
    const tryLock = () => {
      const phone = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      if (!phone) return;
      const short = Math.min(window.innerWidth, window.innerHeight);
      if (short > 540) return;
      const o = window.screen.orientation as ScreenOrientation & {
        lock?: (mode: "portrait") => Promise<void>;
      };
      if (typeof o.lock !== "function") return;
      void o.lock("portrait").catch(() => {});
    };
    tryLock();
    document.addEventListener("visibilitychange", tryLock);
    window.addEventListener("orientationchange", tryLock);
    return () => {
      document.removeEventListener("visibilitychange", tryLock);
      window.removeEventListener("orientationchange", tryLock);
    };
  }, []);

  const showMap = screen === "map";

  return (
    <div
      className="app-frame"
      style={{ paddingBottom: vvPad || undefined, ["--kb" as string]: `${vvPad}px` }}
    >
      <div
        className={cn(
          "absolute inset-0 z-0 isolate",
          !showMap && "invisible pointer-events-none",
        )}
      >
        <MapCanvas
          filter={filter}
          onOpen={(id) => openSpot(id, "map")}
          onCluster={(ids) =>
            openSheet({
              kind: "cluster",
              title: plWaters(ids.length, true),
              ids,
            })
          }
          visible={showMap}
        />
      </div>

      {showMap && catalogError && (
        <div className="absolute top-[max(3.5rem,env(safe-area-inset-top))] left-3 right-3 z-50 rounded-2xl bg-card p-3 ring-1 ring-danger/40">
          <p className="text-sm font-medium">{catalogError}</p>
          <button
            type="button"
            className="tap mt-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            onClick={() => void retryCatalog()}
          >
            Spróbuj ponownie
          </button>
        </div>
      )}
      {showMap && (
        <>
          <div className="chrome-in map-hud">
            <FishFab />
            <OnlinePill n={online} weather={weather} />
          </div>
          <div className="map-chrome chrome-in">
            <div className="map-chrome-left">
              <CoffeeAsk />
              <ConsentBanner />
              <OfflineReady />
              <CoordsBanner />
              <OfflinePanel />
              <FilterBar />
              <MapSearch />
            </div>
            <div className="map-chrome-right">
              <RightMenu weather={weather} />
            </div>
          </div>
          <MapSheet />
        </>
      )}

      {(screen === "list" || screen === "pzw" || screen === "specjalne") && (
        <SpotList key={screen} />
      )}
      {screen === "journal" && <Journal />}
      {screen === "ryby" && <SpeciesList />}
      {screen === "pozwolenia" && <PermitsPage />}
      {screen === "kit" && <Toolkit />}
      {screen === "species-waters" && <SpeciesWaters />}
      {screen === "host-waters" && <HostWaters />}
      {screen === "spot" && <SpotDetail />}
      {screen === "weather" && <WeatherPage weather={weather} />}
      {screen === "install" && <InstallPage />}
      {screen === "compare" && <ComparePage />}
      <DownMenu />
      <div
        className="phone-portrait-gate"
        role="alertdialog"
        aria-live="polite"
        aria-label="Obróć telefon w pion"
      >
        <div className="phone-portrait-card">
          <svg className="phone-tilt" viewBox="0 0 64 64" width="52" height="52" aria-hidden>
            <rect
              x="20"
              y="8"
              width="24"
              height="48"
              rx="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <circle cx="32" cy="49" r="1.7" fill="currentColor" />
          </svg>
          <p>Obróć telefon w pion</p>
        </div>
      </div>
    </div>
  );
}
