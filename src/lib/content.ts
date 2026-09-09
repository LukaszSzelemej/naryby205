import { CUPLINK, INSTAGRAM } from "@/lib/catalog";

export const COOKIES_TEXT = {
  title: "Ciasteczka i podobne technologie",
  intro:
    "Ta informacja spełnia obowiązek z art. 13 RODO oraz przepisów o poufności komunikacji elektronicznej (Prawo komunikacji elektronicznej — zgoda na zapisywanie informacji na urządzeniu końcowym, z wyjątkiem zapisu ściśle niezbędnego do świadczenia usługi, o którą prosisz).",
  about:
    "Atlas wędkarski — regionalna aplikacja mapy łowisk województwa zachodniopomorskiego. Kontakt: Instagram @method_feeder_szczecin.",
  useTitle: "Czego używamy",
  useLead:
    "Atlas nie wstawia reklamowych trackerów ani pikseli analitycznych. Nie sprzedajemy danych. W praktyce zapis na Twoim telefonie to nie klasyczne ciasteczka marketingowe, tylko pamięć przeglądarki potrzebna do działania aplikacji.",
  items: [
    {
      t: "Niezbędne (bez zgody)",
      d: "pamięć lokalna dziennika, ocen i ulubionych; sesja z ostatnią lokalizacją (po Twojej zgodzie systemu na GPS); znacznik ekranu ładowania; paczka mapy offline (Cache API). Podstawa: art. 6 ust. 1 lit. b i f RODO oraz wyjątek dla zapisu niezbędnego do usługi.",
    },
    {
      t: "Lokalizacja",
      d: "tylko na tym urządzeniu, do mapy, odległości i kompasu — po zgodzie na pasku na mapie. Kierunek z GPS gdy się ruszasz oraz z czujnika orientacji telefonu. Nie wysyłamy jej na nasz serwer. Odmowę cofniesz ikoną lokalizacji.",
    },
    {
      t: "Online",
      d: "liczba otwartych kart Atlasu w tej przeglądarce oraz aktywne sesje aplikacji (sygnał zostaje na urządzeniu albo w krótkotrwałej pamięci serwera podglądu, bez bazy nazwisk). Bez nazwiska, bez lokalizacji i bez IP w treściach.",
    },
    {
      t: "Pogoda",
      d: "zapytania do Open-Meteo ze współrzędnymi łowiska albo przybliżonego terenu — to dostawca zewnętrzny, jego serwery mogą zapisać logi techniczne.",
    },
    {
      t: "Stany rzek",
      d: "przy karcie rzeki atlas pyta IMGW-PIB (danepubliczne.imgw.pl) o wodowskazy. Powiadomienia o skoku stanu idą przez serwer atlasu, bez Twojej lokalizacji.",
    },
    {
      t: "Mapa",
      d: "OpenStreetMap (kafelki osm.org, polskie nazwy). Ciemna mapa to te same kafelki, przyciemnione w aplikacji — bez zewnętrznego API. Offline zapisujesz OSM sam, w zakładce Offline.",
    },
  ],
  thirdTitle: "Ciasteczka stron trzecich",
  third:
    "Atlas sam ich nie ustawia. Pojawiają się dopiero, gdy wyjdziesz poza aplikację: zezwolenie PZW, Facebook gospodarza, Instagram, Cuplink („Postaw kawę”), Google Maps. Tam obowiązują polityki tych serwisów. Zgoda — jeśli wymagana — jest po ich stronie.",
  rightsTitle: "Twoje prawa",
  rights:
    "Masz prawo dostępu, sprostowania, usunięcia, ograniczenia, sprzeciwu i skargi do Prezesa UODO. Ponieważ dziennik i oceny siedzą na telefonie, najszybsze usunięcie to: wyczyść dane witryny w ustawieniach przeglądarki albo usuń paczkę offline w Niezbędniku. Lokalizację wyłączysz w ustawieniach systemu.",
  safeTitle: "Bezpieczeństwo w przeglądarce",
  safe:
    "Wyszukiwarka przyjmuje tylko słowa. Linki gospodarzy muszą być http(s) — bez javascript. Licznik odwiedzin jest ograniczony. Atlas nie wstawia trackerów ani reklamowych pikseli.",
  how: [
    "iPhone / Safari: Ustawienia → Safari → Wyczyść historię i dane witryn, albo dane dla tej strony.",
    "Android / Chrome: ikona kłódki lub menu → Informacje o witrynie → Wyczyść i zresetuj.",
    "Mapa offline: Niezbędnik → Offline → pobierz ponownie albo wyczyść dane witryny.",
  ],
};

export const ETYKIETA = [
  {
    title: "Kultura nad wodą",
    items: [
      "Nie wchodź w łowisko sąsiada. Odległość — tyle, żeby żyłki się nie krzyżowały.",
      "Nie hałasuj, nie puszczaj głośnej muzyki. Brzeg to nie impreza.",
      "Nie świeć latarką po wodzie i w oczy innym. Czołówka w dół.",
      "Nie zastawiaj zejścia, pomostu i parkingu. Przyczepa i auto — tak, żeby karetka weszła.",
      "Pytaj, zanim wejdziesz na prywatny brzeg. „Tu zawsze się łowiło” nic nie znaczy.",
      "Ryby pokazujesz krótko, mokrymi rękami, i wracają do wody. Nie na piasek, nie na trawnik.",
    ],
  },
  {
    title: "Biwak",
    items: [
      "Namiot i biwak tam, gdzie gospodarz albo PZW pozwala. Nie na plaży, nie w trzcinach, nie pod znakiem zakazu.",
      "Ognisko tylko w wyznaczonym palenisku. W lesie i przy trzcinie — często zakaz.",
      "Toaleta: szambo, toaleta gospodarza albo chemia. Nie krzaki przy wodzie.",
      "Zostawiasz brzeg jak zastałeś. Ślady opon i paleniska to nie pamiątka.",
    ],
  },
  {
    title: "Czystość i środowisko",
    items: [
      "Śmieci — wszystkie, także te nie twoje przy stanowisku — wracają do domu albo do kosza.",
      "Żyłka, plecionka i opakowania po zanęcie zabijają ptaki i wydry. Nie w krzakach.",
      "Zanęta z umiarem. Kilo na sesję, nie taczka. Woda nie jest kompostownikiem.",
      "Haczyki bez zadziora przy no-kill, mata i mokre ręce przy odhaczaniu.",
      "Nie publikuj dokładnych tarlisk i gniazd — atlas ma charakter poglądowy.",
    ],
  },
  {
    title: "Łowiska komercyjne",
    items: [
      "Karnet gospodarza zamiast zezwolenia PZW. Czytaj regulamin przed pierwszym rzutem.",
      "No-kill, mata, haczyki bez zadziora i zakaz zanęty — typowe, nie wyjątkowe.",
      "Nie wjeżdżaj na stanowisko, nie hałasuj, nie zostawiaj śmieci. Gospodarz widzi wszystko.",
      "Ryby pokazujesz krótko i wracają do wody. Zdjęcie na trawniku to często koniec karnetu.",
    ],
  },
];

export const METHOD_FEEDER: { title: string; body?: string; items?: string[] }[] = [
  {
    title: "Co to jest",
    body: "Method feeder to grunt z płaskim koszykiem. Zanęta siedzi na koszyku, haczyk w zanęcie albo tuż obok, przypon krótki — 8 do 12 cm. Ryba podpływa do talerzyka, żeruje i bierze. To nie klasyczny feeder: tam klatka i długi przypon, tu wszystko w jednym miejscu.",
  },
  {
    title: "Sprzęt",
    items: [
      "Wędka method / feeder 3,3–3,9 m, akcja progresywna, ciężar wyrzutu 40–80 g. Na Dąbiu i wietrze — sztywniejsza.",
      "Kołowrotek 4000–6000, równy hamulec. Klip na szpuli, żeby wracać w to samo miejsce.",
      "Żyłka 0,22–0,28 albo plecionka z fluorocarbonowym przyponem. Na karpia grubiej, na leszcza cieniej.",
      "Koszyk method 20–50 g: płytka woda i cisza — lżejszy; głębiej, prąd, wiatr — cięższy.",
      "Haczyki 10–16. Na komercyjnych często bez zadziora. Przypon 0,16–0,22, krótki.",
    ],
  },
  {
    title: "Zanęta i przynęta",
    items: [
      "Mix method: klei się w locie, na dnie puszcza chmurę. Za sypka spada z koszyka, za twarda leży jak cegła.",
      "Pellet, kukurydza, pinka, white worm, wafters, dumbells. Hair rig albo haczyk schowany w kulce.",
      "Kilo na sesję, nie taczka. Woda nie jest kompostownikiem — i tak lepiej bierze na mniej.",
      "Na leszcza i płoć: drobniejsza frakcja, słodsza. Na karpia i lina: pellet, kukurydza, cięższy mix.",
    ],
  },
  {
    title: "Technika",
    items: [
      "Wyrzut w to samo miejsce. Klip. Po 15–25 minutach ściągasz i nowy koszyk — chyba że tip już pracuje.",
      "Nie zacinaj jak spinning. Method często zaciąga sam: najpierw delikatne kiwnięcia, potem wyciąga.",
      "Czekaj. Ciągłe przerzucanie to nie method, to spławik bez spławika.",
      "Po wzroście ciśnienia — mniej zanęty, dłuższe czekanie. Po spadku drapieżnik może przeszkadzać, ale leszcz lubi chmurę.",
    ],
  },
  {
    title: "Gatunki i wody",
    body: "Leszcz, płoć, karp, lin, karaś, amur. W Zachodniopomorskiem: Odra, Dąbie, zalewy, jeziora leszczowe i komercyjne. Na Miedwiu, Drawsku i Ińsku method działa, ale karnet gospodarza, nie składka PZW. Na komercyjnych method jest królową — czytaj regulamin: często no-kill, mata, haczyk bez zadziora.",
  },
  {
    title: "Pory",
    items: [
      "Zimna woda: drobna zanęta, mały haczyk, płoć i leszcz. Czekasz dłużej.",
      "10–16 °C: klasyczny method na leszcza. Okno, które w atlasie lubi grunt.",
      "Ciepło: karp, lin, amur. Świt, zmierzch, noc. W południe — cień i głębiej.",
      "Gorąco: mniej zanęty, wafters zamiast kukurydzy, noc jeśli gospodarz pozwala.",
    ],
  },
  {
    title: "Częste błędy",
    items: [
      "Za długi przypon — to już feeder, nie method. Haczyk ma być w zanęcie.",
      "Za dużo zanęty. Ryba syta nie bierze, a dno ginie pod ciastem.",
      "Inne miejsce co rzut. Method żyje z regularności.",
      "Twarda jak kamień albo sypka jak mąka. Mix ma trzymać lot i sypać na dnie.",
    ],
  },
];

export const PORADNIK = [
  {
    title: "Świt i zmierzch",
    body: "Najlepsze okna żeru: około godziny przed wschodem do półtorej godziny po nim oraz półtorej godziny przed zachodem do ok. 50 min po. Atlas liczy to ze współrzędnych łowiska, nie z zegarka Szczecina.",
  },
  {
    title: "Księżyc",
    body: "Przy pełni drapieżnik żeruje płycej i dłużej po zmroku. Nów nie psuje dnia. Atlas daje za pełnię tylko drobną korektę wieczorem i w nocy — pogoda i ochrona są ważniejsze.",
  },
  {
    title: "Ciśnienie",
    body: "Spadek — drapieżnik często rusza (spinning, trolling). Wzrost po froncie — brania cichną, method i grunt, wolniejsza prezentacja. Stabilne 1008–1022 hPa to równy dzień na spławik i grunt.",
  },
  {
    title: "Wiatr i tafla",
    body: "Lekki–umiarkowany wiatr napowietrza wodę. Silny — żer na nawietrznej. Cisza sprzyja spławikowi, gorzej tlenowi. Przy sztormie zostań w zatoce albo zmień dzień.",
  },
  {
    title: "Woda i pory roku",
    body: "Zimna woda: szczupak, okoń, sieja. 10–16 °C: sandacz i method na leszcza. Ciepła: karp, lin, amur; drapieżnik rano i wieczorem. Gorąco: świt, zmierzch, noc, mniej zanęty.",
  },
  {
    title: "Zezwolenia",
    body: "Składka PZW obejmuje wody okręgu — nie Miedwie (Modehpolmo), nie Drawsko (GR Czaplinek), nie Ińsko (ICR), nie WIR i nie Bałtyk (GIRM). Karnet gospodarza na komercyjnych. Zawsze czytaj aktualny regulamin.",
  },
  {
    title: "Method feeder",
    body: "Koszyk, krótki przypon, spokojna prezentacja. Leszcz, płoć, karp, lin. Po wzroście ciśnienia — mniejsza zanęta, dłuższe czekanie. Nie taczka zanęty: kilo na sesję.",
  },
  {
    title: "Poglądowość",
    body: "Poradnik poglądowy. Ryba nie czyta algorytmu — wiatr, woda i obecność na brzegu decydują.",
  },
];

export const OFFLINE_COPY = {
  title: "Mapa offline",
  body: "Kafelki województwa zapisują się w pamięci przeglądarki przy normalnym oglądaniu mapy (zoom 8–11). Przy brzegu, bez sieci, atlas otworzy ostatnio widziany obszar. Pobierz województwo najlepiej na Wi‑Fi. Bufor przeglądania nie kasuje paczki.",
  panel:
    "Pobierz kafelki województwa (zoom 8–11) plus okolice łowisk. Najlepiej przez Wi‑Fi.",
};

export const ZAPIS_COPY = {
  title: "Zapis na urządzeniu",
  body: "Dodaj Atlas wędkarski do ekranu początkowego — otworzy się jak aplikacja, bez sklepu.",
  iosTitle: "iPhone",
  ios: [
    "Otwórz tę stronę w Safari (nie w Chrome).",
    "Dotknij przycisku Udostępnij na dole.",
    "Wybierz „Dodaj do ekranu początkowego”.",
    "Potwierdź nazwę Atlas wędkarski — ikona pojawi się obok innych aplikacji.",
  ],
  androidTitle: "Android",
  android: [
    "Otwórz w Chrome.",
    "Menu (trzy kropki) → „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.",
    "Potwierdź. Atlas wędkarski pojawi się w szufladzie aplikacji.",
  ],
};

export const COFFEE_COPY = {
  kicker: "Atlas, który jedzie z Tobą nad wodę!",
  paragraphs: [
    "Ponad tysiąc łowisk: jezior, rzek, zalewów, stawów i brzeg Bałtyku w województwie zachodniopomorskim. Mapa z Twoją lokalizacją, żerowanie ryb na dziś, ciśnienie, wschód i zachód słońca, fazy księżyca, zmiany ciśnienia, stany wody, wymiary oraz okresy ochronne, koła PZW i dziennik w telefonie, bez subskrypcji i bez reklam.",
    "Aplikacja stworzona z pasji do wędkowania z myślą o feederowcach, spinningistach i każdym, kto odpoczywa nad wodą. Jeśli atlas oszczędzi Ci czas i podpowie, gdzie możesz oczyścić umysł — postaw kawę. Ty decydujesz.",
    "Atlas wędkarski to regionalna aplikacja — mapa łowisk Pomorza Zachodniego. Zrobiona z zamiłowania do wędkarstwa, a nie z korporacyjnego szablonu. Skupia się na Zachodnim Pomorzu, ale sięga Bałtyku, Zalewu Szczecińskiego, pojezierzy i sąsiednich zbiorników.",
    "To nie kolejny ogólnopolski katalog z tysiącem wpisów i pustymi kartami. To narzędzie dla Ciebie. To atut w telefonie dla każdego kto łowi na Odrze, Drawie, Parsęcie, Redze, Miedwiu, Drawsku, Dąbiu i setkach innych jezior czy łowisk komercyjnych.",
    "Możesz skorzystać z szybkiego podglądu terenu, zoomu i geolokalizacji. To baza miejscówek, wód okręgowych i łowisk specjalnych. Atlas to także Twój dziennik wyjazdów i brań.",
    "Znajdziesz tu wszystko co przyda Ci się przed wyjazdem na pewną miejscówkę. Regionalna precyzja zamiast „cała Polska na jednej mapie bez konkretów”. Wszystko w jednym miejscu i od razu. Lepszy do planowania weekendu z wędką, w namiocie czy na grillu z bliskimi, niż kolejny ogólnopolski atlas z recyklingowym pustosłowiem.",
    "Szukasz miejsca? Wpisz nazwę. Jedziesz w teren? Włącz geolokalizację. Nie pamiętasz wymiaru albo terminu? Wejdź w niezbędnik. Chcesz wiedzieć, co u Ciebie działało tydzień temu? Zapisz to w dzienniku.",
    "Bez reklam, bez ściemy. Region, który znasz albo chcesz poznać — Szczecin, Dębno, Choszczno, Koszalin, Parsęta, Rega i setki miejsc, o których nie piszą ogólnopolskie przewodniki.",
    "Nie jest to oficjalny wykaz zbiorników wodnych i łowisk, dlatego przed wyjazdem zawsze sprawdź aktualne regulaminy, opłaty i zezwolenia.",
    "Jeśli spodobało Ci się narzędzie wymyślone przez wędkarza dla wędkarzy — postaw kawę. To paliwo, żeby mapa żyła, łowiska się aktualizowały, a dziennik nie zniknął po pierwszym sezonie. To sygnał dla mnie, że moja praca Wam pomogła.",
    "Nie zgaduj, gdzie dzisiaj bierze. Otwórz mapę. Jedź, gdzie zaplanowałeś. Zarzucaj świadomie. Złów życiówkę. Potem postaw espresso.",
  ],
  cuplink: CUPLINK,
  instagram: INSTAGRAM,
};

export const DOKUMENTY = {
  karta: {
    title: "Karta wędkarska",
    body: "Państwowy dokument uprawniający do amatorskiego połowu ryb w wodach śródlądowych. Wydaje starosta (wydział ochrony środowiska) po zdaniu egzaminu. Na morzu karta nie obowiązuje — tam GIRM.",
    exam: [
      "Egzamin zdajesz w kole PZW albo u organizatora wskazanego przez starostę.",
      "Zakres: gatunki, wymiary ochronne, sprzęt, etyka, przepisy.",
      "Po egzaminie wniosek u starosty powiatu zamieszkania. Karta jest bezterminowa.",
    ],
  },
  sea: {
    title: "Bałtyk i Zalew — GIRM",
    body: "Amatorski połów w morskich wodach RP wymaga zezwolenia Głównego Inspektoratu Rybołówstwa Morskiego. Karta wędkarska nie obowiązuje. Składka PZW też nie. Zalew Szczeciński od strony morskiej to już GIRM; Dąbie i Odra — PZW Szczecin (z wyjątkami na Dąbiu).",
  },
  wir: {
    title: "Wody Polskie / RZGW Szczecin",
    body: "Na wodach Wód Polskich / RZGW: osobne zezwolenie w systemie WIR — składka PZW nie wystarczy.",
  },
  clubs:
    "Koła PZW działają przy okręgach. Składkę płacisz w okręgu, zezwolenie kupujesz online. Adres koła i dyżury — na stronie okręgu.",
  privateNote:
    "Łowiska prywatne i komercyjne wymagają karnetu gospodarza. Składka PZW tam zwykle nie obowiązuje.",
};

export const INSTALL_COPY = {
  ios: [
    "Otwórz tę stronę w Safari (nie w Chrome).",
    "Dotknij przycisku Udostępnij na dole.",
    "Wybierz „Dodaj do ekranu początkowego”.",
    "Potwierdź nazwę Atlas wędkarski — ikona pojawi się obok innych aplikacji.",
  ],
  android: [
    "Otwórz w Chrome.",
    "Menu (trzy kropki) → „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.",
    "Potwierdź. Atlas wędkarski pojawi się w szufladzie aplikacji.",
  ],
};

export const LICENSES_COPY = {
  title: "Licencje i źródła",
  lead: "Mapa, dane i biblioteki, z których korzysta atlas. Źródło otwiera licencję albo serwis.",
  groups: [
    {
      title: "Mapa i dane",
      items: [
        {
          t: "OpenStreetMap",
          d: "Kafelki mapy i nazwy miejsc © OpenStreetMap contributors. Dane na licencji ODbL 1.0. Ciemna mapa to te same kafelki, przyciemnione w aplikacji.",
          href: "https://www.openstreetmap.org/copyright",
        },
        {
          t: "CARTO Voyager",
          d: "Zapasowe kafelki, gdy osm.org nie odpowiada (403/429). Dane OSM, styl © CARTO. Wymagane oznaczenie: © OpenStreetMap, © CARTO.",
          href: "https://carto.com/attributions",
        },
        {
          t: "Leaflet",
          d: "Silnik mapy Leaflet 1.9, licencja BSD-2-Clause.",
          href: "https://leafletjs.com",
        },
        {
          t: "GUGiK — PRNG",
          d: "Państwowy Rejestr Nazw Geograficznych: urzędowe nazwy i położenie wód. Dane publiczne Głównego Urzędu Geodezji i Kartografii / geoportal.gov.pl, bezpłatne do dowolnego użytku.",
          href: "https://www.geoportal.gov.pl",
        },
        {
          t: "GUGiK — BDOT10k",
          d: "Baza Danych Obiektów Topograficznych (warstwa PTWP): powierzchnie stawów i wód komercyjnych. Dane publiczne, uwolnione 31 lipca 2020 — bezpłatne do dowolnego użytku.",
          href: "https://www.geoportal.gov.pl/pl/dane/baza-danych-obiektow-topograficznych-bdot10k/",
        },
        {
          t: "Open-Meteo",
          d: "Prognoza pogody, ciśnienie, wiatr, opad i temperatura wody. Dane API na licencji CC BY 4.0 — wymagane oznaczenie Open-Meteo.",
          href: "https://open-meteo.com/en/license",
        },
        {
          t: "IMGW-PIB",
          d: "Stany wody na rzekach (wodowskazy) — dane publiczne Instytutu Meteorologii i Gospodarki Wodnej – Państwowego Instytutu Badawczego, danepubliczne.imgw.pl.",
          href: "https://danepubliczne.imgw.pl",
        },
        {
          t: "RAPR i rozporządzenie",
          d: "Wymiary i okresy ochronne: Regulamin Amatorskiego Połowu Ryb PZW oraz rozporządzenie Ministra Rolnictwa i Rozwoju Wsi. To przepisy, nie licencja otwarta — przed wyjazdem sprawdź aktualny tekst.",
          href: "https://www.gov.pl/web/wody-polskie-szczecin/regulamin-amatorskiego-polowu-ryb",
        },
      ],
    },
    {
      title: "Oprogramowanie",
      items: [
        {
          t: "React",
          d: "Interfejs aplikacji. Licencja MIT, © Meta Platforms.",
          href: "https://github.com/facebook/react/blob/main/LICENSE",
        },
        {
          t: "Zustand",
          d: "Stan aplikacji (mapa, dziennik, zgody). Licencja MIT.",
          href: "https://github.com/pmndrs/zustand/blob/main/LICENSE",
        },
        {
          t: "TanStack",
          d: "Router i Start (nawigacja, budowa strony). Licencja MIT.",
          href: "https://github.com/TanStack/router/blob/main/LICENSE",
        },
        {
          t: "Tailwind CSS",
          d: "Warstwa stylów. Licencja MIT.",
          href: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE",
        },
        {
          t: "Zod",
          d: "Walidacja danych. Licencja MIT.",
          href: "https://github.com/colinhacks/zod/blob/main/LICENSE",
        },
      ],
    },
  ],
};
