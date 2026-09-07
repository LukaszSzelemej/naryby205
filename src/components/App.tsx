import { useEffect, useState } from "react";
import { MapCanvas } from "@/components/MapCanvas";
import {
  ConsentBanner,
  CoordsBanner,
  DownMenu,
  FilterBar,
  FishFab,
  MapSearch,
  OfflinePanel,
  OnlinePill,
  RightMenu,
  requestLocation,
} from "@/components/Chrome";
import { SpotList } from "@/components/SpotList";
import { SpotDetail } from "@/components/SpotDetail";
import { Journal } from "@/components/Journal";
import { InstallPage, SpeciesWaters, HostWaters, Toolkit } from "@/components/Toolkit";
import { WeatherPage } from "@/components/WeatherPage";
import { ComparePage } from "@/components/Compare";
import { MapSheet } from "@/components/MapSheet";
import { MAP_CENTER, nearestTo, retryCatalog } from "@/lib/catalog";
import { startPresence } from "@/lib/presence";
import { useAtlas } from "@/lib/store";
import { fetchWeather } from "@/lib/weather";
import type { WeatherNow } from "@/lib/types";
import { loadConsent, loadFavorites, loadJournal, loadLastGeo } from "@/lib/storage";
import { resetView } from "@/lib/map-api";
import { cn } from "@/lib/utils";

export function App() {
  const screen = useAtlas((s) => s.screen);
  const filter = useAtlas((s) => s.filter);
  const catalogError = useAtlas((s) => s.catalogError);
  const openSpot = useAtlas((s) => s.openSpot);
  const openSheet = useAtlas((s) => s.openSheet);
  const nearbyPending = useAtlas((s) => s.nearbyPending);
  const geo = useAtlas((s) => s.geo);
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
    });
    const t = window.setTimeout(() => {
      resetView();
      requestLocation();
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

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
  }, [geo?.lat, geo?.lng]);

  useEffect(() => {
    if (!nearbyPending || !geo) return;
    const ids = nearestTo(geo.lat, geo.lng, 5).map((w) => w.id);
    openSheet({ kind: "nearby", title: "Najbliższe", ids });
  }, [nearbyPending, geo, openSheet]);

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

  const showMap = screen === "map";

  return (
    <div
      className="app-frame"
      style={{ paddingBottom: vvPad || undefined, ["--kb" as string]: `${vvPad}px` }}
    >
      <div
        className={cn(
          "absolute inset-0",
          !showMap && "invisible pointer-events-none",
        )}
      >
        <MapCanvas
          filter={filter}
          onOpen={(id) => openSpot(id, "map")}
          onCluster={(ids) =>
            openSheet({
              kind: "cluster",
              title:
                ids.length === 1
                  ? "Łowisko"
                  : ids.length < 5
                    ? `${ids.length} łowiska tutaj`
                    : `${ids.length} łowisk tutaj`,
              ids,
            })
          }
          visible={showMap}
        />
      </div>

      {catalogError && (
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
          <div className="chrome-in">
            <FishFab />
            <OnlinePill n={online} weather={weather} />
          </div>
          <div className="map-chrome chrome-in">
            <div className="map-chrome-left">
              <ConsentBanner />
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
      {screen === "kit" && <Toolkit />}
      {screen === "species-waters" && <SpeciesWaters />}
      {screen === "host-waters" && <HostWaters />}
      {screen === "spot" && <SpotDetail />}
      {screen === "weather" && <WeatherPage weather={weather} />}
      {screen === "install" && <InstallPage />}
      {screen === "compare" && <ComparePage />}
      <DownMenu />
    </div>
  );
}
