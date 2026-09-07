import { create } from "zustand";
import type { JournalEntry, MapFilter, Screen, SortMode } from "@/lib/types";
import {
  saveConsent,
  saveFavorites,
  saveJournal,
  saveLastGeo,
  type ConsentState,
} from "@/lib/storage";

type Geo = { lat: number; lng: number } | null;

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
  mapSpecies: string | null;
  mapNight: boolean;
  mapBoats: boolean;
  mapNonce: number;
  listFilter: MapFilter;
  listHost: MapFilter;
  listKind: MapFilter;
  listFavOnly: boolean;
  listSpecies: string | null;
  listObwod: string;
  moreOpen: boolean;
  satellite: boolean;
  showCoords: boolean;
  spotMapFull: boolean;
  mapSearchOpen: boolean;
  offlineOpen: boolean;
  selectedId: string | null;
  selectedSpeciesId: string | null;
  selectedHostKey: string | null;
  compareA: string | null;
  compareB: string | null;
  kitTab:
    | "gatunki"
    | "dokumenty"
    | "etykieta"
    | "poradnik"
    | "offline"
    | "zapis"
    | "ciasteczka"
    | "kawa"
    | null;
  letter: string | null;
  sort: SortMode;
  listQuery: string;
  mapQuery: string;
  geo: Geo;
  geoDenied: boolean;
  consent: ConsentState;
  favorites: string[];
  journal: JournalEntry[];
  startBoot: () => void;
  finishBoot: () => void;
  setScreen: (s: Screen) => void;
  back: () => void;
  openSpot: (id: string, from?: Screen) => void;
  openHost: (key: string) => void;
  closeSpot: () => void;
  setFilter: (f: MapFilter) => void;
  setMapSpecies: (id: string | null) => void;
  setMapNight: () => void;
  setMapBoats: () => void;
  setListSpecies: (id: string | null) => void;
  setListObwod: (q: string) => void;
  openCompare: (id: string) => void;
  setCompareB: (id: string) => void;
  setListFilter: (f: MapFilter) => void;
  toggleMore: () => void;
  setMoreOpen: (v: boolean) => void;
  setSatellite: (v: boolean) => void;
  toggleSatellite: () => void;
  setShowCoords: (v: boolean) => void;
  setSpotMapFull: (v: boolean) => void;
  setMapSearchOpen: (v: boolean) => void;
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
  mapSpecies: null,
  mapNight: false,
  mapBoats: false,
  mapNonce: 0,
  listFilter: "all",
  listHost: "all",
  listKind: "all",
  listFavOnly: false,
  listSpecies: null,
  listObwod: "",
  moreOpen: false,
  satellite: false,
  showCoords: false,
  spotMapFull: false,
  mapSearchOpen: false,
  offlineOpen: false,
  selectedId: null,
  selectedSpeciesId: null,
  selectedHostKey: null,
  compareA: null,
  compareB: null,
  kitTab: null,
  letter: null,
  sort: "az",
  listQuery: "",
  mapQuery: "",
  geo: null,
  geoDenied: false,
  consent: null,
  favorites: [],
  journal: [],
  startBoot: () =>
    set({
      booting: true,
      bootKey: get().bootKey + 1,
      screen: "map",
      moreOpen: false,
      offlineOpen: false,
      showCoords: false,
      spotMapFull: false,
      mapSearchOpen: false,
      selectedId: null,
    }),
  finishBoot: () => set({ booting: false }),
  setScreen: (screen) =>
    set((s) => ({
      prevScreen: s.screen,
      screen,
      moreOpen: false,
      mapSearchOpen: false,
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
      mapSearchOpen: false,
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
      mapSearchOpen: false,
      mapSpecies: filter === "all" ? null : s.mapSpecies,
      mapNight: filter === "all" ? false : s.mapNight,
      mapBoats: filter === "all" ? false : s.mapBoats,
      mapNonce: s.mapNonce + 1,
    })),
  setMapSpecies: (id) =>
    set((s) => ({
      mapSpecies: s.mapSpecies === id ? null : id,
      screen: "map",
      mapNonce: s.mapNonce + 1,
    })),
  setMapNight: () =>
    set((s) => ({
      mapNight: !s.mapNight,
      screen: "map",
      mapNonce: s.mapNonce + 1,
    })),
  setMapBoats: () =>
    set((s) => ({
      mapBoats: !s.mapBoats,
      screen: "map",
      mapNonce: s.mapNonce + 1,
    })),
  setListSpecies: (id) =>
    set((s) => ({
      listSpecies: s.listSpecies === id ? null : id,
      letter: null,
    })),
  setListObwod: (listObwod) => set({ listObwod, letter: null }),
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
          listFilter: "all",
          listHost: locked,
          listKind: "all",
          listFavOnly: false,
          letter: null,
          listQuery: "",
          listSpecies: null,
          listObwod: "",
        };
      }
      if (id === "ulubione") {
        return {
          listFavOnly: !s.listFavOnly,
          listFilter: !s.listFavOnly ? "ulubione" : s.listKind !== "all" ? s.listKind : s.listHost,
          letter: null,
          listQuery: "",
        };
      }
      if (HOST_FILTERS.has(id)) {
        const nextHost = s.listHost === id && locked === "all" ? "all" : id;
        const host = locked !== "all" && id !== "prywatne" ? locked : nextHost;
        return {
          listHost: host,
          listFilter: s.listKind !== "all" ? s.listKind : host,
          letter: null,
          listQuery: "",
        };
      }
      if (KIND_FILTERS.has(id)) {
        const nextKind = s.listKind === id ? "all" : id;
        return {
          listKind: nextKind,
          listFilter: nextKind !== "all" ? nextKind : s.listHost,
          letter: null,
          listQuery: "",
        };
      }
      return { listFilter: id, letter: null, listQuery: "" };
    }),
  toggleMore: () => set((s) => ({ moreOpen: !s.moreOpen })),
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  setSatellite: (satellite) => set({ satellite }),
  toggleSatellite: () => set((s) => ({ satellite: !s.satellite })),
  setShowCoords: (showCoords) => set({ showCoords }),
  setSpotMapFull: (spotMapFull) => set({ spotMapFull }),
  setMapSearchOpen: (mapSearchOpen) => set({ mapSearchOpen }),
  setOfflineOpen: (offlineOpen) => set({ offlineOpen }),
  setKitTab: (kitTab) => set({ kitTab, screen: "kit" }),
  setLetter: (letter) => set({ letter }),
  setSort: (sort) => set({ sort }),
  setListQuery: (listQuery) => set({ listQuery }),
  setMapQuery: (mapQuery) => set({ mapQuery }),
  setGeo: (geo) => {
    if (geo) saveLastGeo(geo.lat, geo.lng);
    set({ geo, geoDenied: false });
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
      listFilter: "all",
      listHost: tabHost(screen),
      listKind: "all",
      listFavOnly: false,
      listSpecies: null,
      listObwod: "",
      letter: null,
      listQuery: "",
      sort: "az",
      moreOpen: false,
      mapSearchOpen: false,
      selectedId: null,
      spotMapFull: false,
    }),
}));
