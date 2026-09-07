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
      d: "tylko na tym urządzeniu, do mapy i odległości — po zgodzie na pasku na mapie. Nie wysyłamy jej na nasz serwer. Odmowę cofniesz ikoną lokalizacji.",
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
  lead: "Oznaczenia bibliotek, map i danych, z których korzysta atlas.",
  items: [
    {
      t: "OpenStreetMap",
      d: "Kafelki mapy i nazwy miejsc © OpenStreetMap contributors. Dane na licencji ODbL 1.0. Ciemna mapa używa tych samych kafelków (bez dodatkowego dostawcy).",
      href: "https://www.openstreetmap.org/copyright",
    },
    {
      t: "Leaflet",
      d: "Silnik mapy Leaflet, licencja BSD-2-Clause.",
      href: "https://leafletjs.com",
    },
    {
      t: "Open-Meteo",
      d: "Prognoza pogody i ciśnienie. Licencja CC BY 4.0.",
      href: "https://open-meteo.com",
    },
    {
      t: "Geoportal / GUGiK",
      d: "Nazwy i położenie wód stojących — wykaz urzędowy oraz geoportal.gov.pl.",
      href: "https://www.geoportal.gov.pl",
    },
    {
      t: "RAPR i rozporządzenie",
      d: "Wymiary i okresy ochronne: Regulamin Amatorskiego Połowu Ryb PZW oraz rozporządzenie MRiRW.",
      href: "https://www.gov.pl/web/wody-polskie-szczecin/regulamin-amatorskiego-polowu-ryb",
    },
    {
      t: "IMGW-PIB",
      d: "Stany wody na rzekach — dane publiczne Instytutu Meteorologii i Gospodarki Wodnej.",
      href: "https://danepubliczne.imgw.pl",
    },
  ],
};
