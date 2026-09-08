export type WaterKind =
  | "jezioro"
  | "rzeka"
  | "zalew"
  | "morze"
  | "kanal"
  | "staw"
  | "komercyjne";

export type Tenure = "wody-polskie" | "prywatne" | "specjalne" | "girm";

export type Water = {
  id: string;
  name: string;
  kind: WaterKind;
  aliases?: string[];
  powiat: string;
  gmina?: string;
  okrag?: string;
  tenure?: Tenure | string;
  lat: number;
  lng: number;
  areaHa?: number | null;
  lengthKm?: number | null;
  maxDepthM?: number | null;
  avgDepthM?: number | null;
  species: string[];
  methods: string[];
  night?: boolean;
  boats?: boolean;
  engines?: string | null;
  featured?: boolean;
  noKill?: boolean;
  access?: string;
  parking?: string;
  summary?: string;
  rules?: string[];
  ticket?: string | null;
  website?: string | null;
  socialUrl?: string | null;
  obwod?: string[];
};

export type ClosedPeriod = { from: string; to: string; note?: string };

export type Species = {
  id: string;
  name: string;
  latin: string;
  minCm: number | null;
  dailyLimit: number | null;
  closed: ClosedPeriod[];
  seaClosed?: ClosedPeriod[];
  seaBan?: boolean;
  predators?: boolean;
};

export type Manager = {
  id: string;
  name: string;
  shortName: string;
  website?: string;
  socialUrl?: string;
  permitUrl?: string;
  permitLabel?: string;
  priceUrl?: string;
  priceLabel?: string;
  priceNote?: string;
};

export type HostKind =
  | "pzw"
  | "pzw-special"
  | "girm"
  | "wir"
  | "modehpolmo"
  | "gr-czaplinek"
  | "gr-insko"
  | "pr-zlocieniec"
  | "pr-szczecinek"
  | "jis-walcz"
  | "ntw"
  | "mtw"
  | "private";

export type MapFilter =
  | "location"
  | "all"
  | "specjalne"
  | "pzw"
  | "jezioro"
  | "prywatne"
  | "zalew"
  | "staw"
  | "rzeka"
  | "kanal"
  | "morze"
  | "komercyjne"
  | "ulubione";

export type Screen =
  | "map"
  | "list"
  | "pzw"
  | "ryby"
  | "specjalne"
  | "pozwolenia"
  | "journal"
  | "kit"
  | "spot"
  | "weather"
  | "install"
  | "species-waters"
  | "host-waters"
  | "compare";

export type SortMode = "az" | "largest" | "fav" | "nearest";

export type JournalEntry = {
  id: string;
  speciesId: string;
  waterId: string;
  lengthCm?: number | null;
  weightKg?: number | null;
  method?: string;
  note?: string;
  createdAt: string;
};

export type WeatherNow = {
  temp: number;
  pressure: number;
  pressureTrend: "up" | "down" | "flat";
  precipitation: number;
  wind: number;
  windDir: number;
  weatherCode: number;
  humidity: number;
  waterTemp: number | null;
  sunrise: string;
  sunset: string;
  daily: WeatherDay[];
  stale?: boolean;
};

export type WeatherDay = {
  date: string;
  tmax: number;
  tmin: number;
  rain: number;
  weatherCode: number;
  wind: number;
};
