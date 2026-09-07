import { create } from "zustand";
import type { JournalEntry, MapFilter, Screen, SortMode } from "@/lib/types";
import {
  saveConsent,
  saveFavorites,
  saveJournal,
  saveLastGeo,
  saveMapDark,
  loadMapDark,
  type ConsentState,
} from "@/lib/storage";

type Geo = { lat: number; lng: number } | null;

export type KitTab =
  | "gatunki"
  | "dokumenty"
  | "etykieta"
  | "poradnik"
  | "offline"
  | "zapis"
  | "ciasteczka"
  | "kawa";

export type MapSheet = {
  kind: "nearby" | "cluster";
  title: string;
  ids: string[];
} | null;

const HOST_FILTERS = new Set<MapFilter>(["pzw", "specjalne", "prywatne"]);
const KIND_FILTERS = new Set<MapFilter>([
  "jezioro",
  "staw",
  "zalew",
  "rzeka",
  "kanal",
  "morze",
  "komercyjne",
]);

type AtlasState = {
  booting: boolean;
  bootKey: number;
  catalogReady: boolean;
  catalogError: string | null;
  screen: Screen;
  prevScreen: Screen;
  filter: MapFilter;
  mapSpecies: string[];
  mapNight: boolean;
  mapBoats: boolean;
  mapNonce: number;
  listHost: MapFilter;
  listKind: MapFilter;
  listFavOnly: boolean;
  listSpecies: string[];
  listObwod: string;
  listNight: boolean;
  listBoats: boolean;
  moreOpen: boolean;
  mapDark: boolean;
  showCoords: boolean;
  spotMapFull: boolean;
  offlineOpen: boolean;
  selectedId: string | null;
  selectedSpeciesId: string | null;
  selectedHostKey: string | null;
  compareA: string | null;
  compareB: string | null;
  kitTab: KitTab | null;
  letter: string | null;
  sort: SortMode;
  listSortAuto: boolean;
  listQuery: string;
  mapQuery: string;
  geo: Geo;
  geoDenied: boolean;
  consent: ConsentState;
  favorites: string[];
  journal: JournalEntry[];
  sheet: MapSheet;
  nearbyPending: boolean;
  startBoot: () => void;
  finishBoot: () => void;
  setScreen: (s: Screen) => void;
  back: () => void;
  openSpot: (id: string, from?: Screen) => void;
  openHost: (key: string) => void;
  closeSpot: () => void;
  setFilter: (f: MapFilter) => void;
  setMapSpecies: (id: string) => void;
  setMapNight: () => void;
  setMapBoats: () => void;
  setListSpecies: (id: string) => void;
  setListObwod: (q: string) => void;
  setListNight: () => void;
  setListBoats: () => void;
  openCompare: (id: string) => void;
  setCompareB: (id: string) => void;
  setListFilter: (f: MapFilter) => void;
  toggleMore: () => void;
  setMoreOpen: (v: boolean) => void;
  toggleMapDark: () => void;
  setShowCoords: (v: boolean) => void;
  setSpotMapFull: (v: boolean) => void;
  setOfflineOpen: (v: boolean) => void;
  setKitTab: (t: AtlasState["kitTab"]) => void;
  setLetter: (l: string | null) => void;
  setSort: (s: SortMode) => void;
  setListQuery: (q: string) => void;
  setMapQuery: (q: string) => void;
  setGeo: (g: Geo) => void;
  setGeoDenied: (v: boolean) => void;
  setConsent: (c: ConsentState) => void;
  toggleFav: (id: string) => void;
  addCatch: (row: JournalEntry) => void;
  removeCatch: (id: string) => void;
  showMyLocation: () => void;
  openList: (screen: Extract<Screen, "list" | "pzw" | "specjalne">) => void;
  openSheet: (sheet: Exclude<MapSheet, null>) => void;
  closeSheet: () => void;
  setNearbyPending: (v: boolean) => void;
};

function tabHost(screen: Screen): MapFilter {
  if (screen === "pzw") return "pzw";
  if (screen === "specjalne") return "specjalne";
  return "all";
}

export const useAtlas = create<AtlasState>((set, get) => ({
  booting: false,
  bootKey: 0,
  catalogReady: false,
  catalogError: null,
  screen: "map",
  prevScreen: "map",
  filter: "all",
  mapSpecies: [],
  mapNight: false,
  mapBoats: false,
  mapNonce: 0,
  listHost: "all",
  listKind: "all",
  listFavOnly: false,
  listSpecies: [],
  listObwod: "",
  listNight: false,
  listBoats: false,
  moreOpen: false,
  mapDark: loadMapDark(),
  showCoords: false,
  spotMapFull: false,
  offlineOpen: false,
  selectedId: null,
  selectedSpeciesId: null,
  selectedHostKey: null,
  compareA: null,
  compareB: null,
  kitTab: null,
  letter: null,
  sort: "az",
  listSortAuto: true,
  listQuery: "",
  mapQuery: "",
  geo: null,
  geoDenied: false,
  consent: null,
  favorites: [],
  journal: [],
  sheet: null,
  nearbyPending: false,
  startBoot: () =>
    set({
      booting: true,
      bootKey: get().bootKey + 1,
      screen: "map",
      moreOpen: false,
      offlineOpen: false,
      showCoords: false,
      spotMapFull: false,
      selectedId: null,
    }),
  finishBoot: () => set({ booting: false }),
  setScreen: (screen) =>
    set((s) => ({
      prevScreen: s.screen,
      screen,
      moreOpen: false,
      letter: screen === s.screen ? s.letter : null,
      listQuery: "",
    })),
  back: () =>
    set((s) => ({
      screen: s.prevScreen || "map",
      selectedId: s.prevScreen === "spot" ? s.selectedId : null,
      spotMapFull: false,
    })),
  openSpot: (id, from) =>
    set((s) => ({
      prevScreen:
        from ??
        (s.screen === "spot" || s.screen === "compare" ? s.prevScreen : s.screen),
      screen: "spot",
      selectedId: id,
      spotMapFull: false,
      sheet: null,
    })),
  openHost: (key) =>
    set((s) => ({
      prevScreen: s.screen,
      screen: "host-waters",
      selectedHostKey: key,
    })),
  closeSpot: () =>
    set((s) => ({
      screen: s.prevScreen && s.prevScreen !== "spot" ? s.prevScreen : "map",
      selectedId: null,
      spotMapFull: false,
    })),
  setFilter: (filter) =>
    set((s) => ({
      filter,
      screen: "map",
      moreOpen: filter === "all" ? false : s.moreOpen,
      mapSpecies: filter === "all" ? [] : s.mapSpecies,
      mapNight: filter === "all" ? false : s.mapNight,
      mapBoats: filter === "all" ? false : s.mapBoats,
      mapNonce: s.filter === filter ? s.mapNonce : s.mapNonce + 1,
    })),
  setMapSpecies: (id) =>
    set((s) => ({
      mapSpecies: s.mapSpecies.includes(id)
        ? s.mapSpecies.filter((x) => x !== id)
        : [...s.mapSpecies, id],
      screen: "map",
    })),
  setMapNight: () =>
    set((s) => ({
      mapNight: !s.mapNight,
      screen: "map",
    })),
  setMapBoats: () =>
    set((s) => ({
      mapBoats: !s.mapBoats,
      screen: "map",
    })),
  setListSpecies: (id) =>
    set((s) => ({
      listSpecies: s.listSpecies.includes(id)
        ? s.listSpecies.filter((x) => x !== id)
        : [...s.listSpecies, id],
      letter: null,
    })),
  setListObwod: (listObwod) => set({ listObwod, letter: null }),
  setListNight: () => set((s) => ({ listNight: !s.listNight, letter: null })),
  setListBoats: () => set((s) => ({ listBoats: !s.listBoats, letter: null })),
  openCompare: (id) =>
    set((s) => ({
      prevScreen: s.screen === "spot" ? s.prevScreen : s.screen,
      screen: "compare",
      compareA: id,
      compareB: s.compareA === id ? s.compareB : null,
    })),
  setCompareB: (id) =>
    set((s) => ({
      compareB: id === s.compareA ? s.compareB : id,
      screen: "compare",
    })),
  setListFilter: (id) =>
    set((s) => {
      const locked = tabHost(s.screen);
      if (id === "all") {
        return {
          listHost: locked,
          listKind: "all",
          listFavOnly: false,
          letter: null,
          listQuery: "",
          listSpecies: [],
          listObwod: "",
          listNight: false,
          listBoats: false,
        };
      }
      if (id === "ulubione") {
        return {
          listFavOnly: !s.listFavOnly,
          letter: null,
          listQuery: "",
        };
      }
      if (HOST_FILTERS.has(id)) {
        const nextHost = s.listHost === id && locked === "all" ? "all" : id;
        const host = locked !== "all" && id !== "prywatne" ? locked : nextHost;
        return {
          listHost: host,
          letter: null,
          listQuery: "",
        };
      }
      if (KIND_FILTERS.has(id)) {
        const nextKind = s.listKind === id ? "all" : id;
        return {
          listKind: nextKind,
          letter: null,
          listQuery: "",
        };
      }
      return { letter: null, listQuery: "" };
    }),
  toggleMore: () => set((s) => ({ moreOpen: !s.moreOpen })),
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  toggleMapDark: () =>
    set((s) => {
      const mapDark = !s.mapDark;
      saveMapDark(mapDark);
      return { mapDark };
    }),
  setShowCoords: (showCoords) => set({ showCoords }),
  setSpotMapFull: (spotMapFull) => set({ spotMapFull }),
  setOfflineOpen: (offlineOpen) => set({ offlineOpen }),
  setKitTab: (kitTab) => set({ kitTab, screen: "kit" }),
  setLetter: (letter) => set({ letter }),
  setSort: (sort) => set({ sort, listSortAuto: false }),
  setListQuery: (listQuery) => set({ listQuery }),
  setMapQuery: (mapQuery) => set({ mapQuery }),
  setGeo: (geo) => {
    if (geo) saveLastGeo(geo.lat, geo.lng);
    set((s) => ({
      geo,
      geoDenied: false,
      sort: geo && s.listSortAuto ? "nearest" : s.sort,
    }));
  },
  setGeoDenied: (geoDenied) => set({ geoDenied }),
  setConsent: (consent) => {
    saveConsent(consent);
    set({ consent });
  },
  toggleFav: (id) => {
    const cur = get().favorites;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    saveFavorites(next);
    set({ favorites: next });
  },
  addCatch: (row) => {
    const next = [row, ...get().journal];
    saveJournal(next);
    set({ journal: next });
  },
  removeCatch: (id) => {
    const next = get().journal.filter((x) => x.id !== id);
    saveJournal(next);
    set({ journal: next });
  },
  showMyLocation: () =>
    set({
      screen: "map",
      filter: "location",
      showCoords: true,
    }),
  openList: (screen) =>
    set({
      prevScreen: get().screen,
      screen,
      listHost: tabHost(screen),
      listKind: "all",
      listFavOnly: false,
      listSpecies: [],
      listObwod: "",
      listNight: false,
      listBoats: false,
      letter: null,
      listQuery: "",
      sort: get().listSortAuto && get().geo ? "nearest" : get().sort,
      moreOpen: false,
      selectedId: null,
      spotMapFull: false,
    }),
  openSheet: (sheet) => set({ sheet, nearbyPending: false, screen: "map" }),
  closeSheet: () => set({ sheet: null }),
  setNearbyPending: (nearbyPending) => set({ nearbyPending, screen: "map" }),
}));
