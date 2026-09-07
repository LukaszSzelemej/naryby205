# Specyfikacja — Atlas wędkarski

**Nazwa:** Atlas wędkarski  
**Wersja:** 1.8.0  
**Adres:** https://www.atlaswedkarski.pl  
**Kontakt / autor:** Instagram [@method_feeder_szczecin](https://www.instagram.com/method_feeder_szczecin)  
**Wsparcie:** https://cuplink.to/atlaswedkarski („Postaw kawę”)  
**Repozytorium kanoniczne (stan tej specyfikacji):** [github.com/LukaszSzelemej/naryby32](https://github.com/LukaszSzelemej/naryby32)  
**Zasięg:** województwo zachodniopomorskie (Pomorze Zachodnie), z Bałtykiem, Zalewem Szczecińskim i wodami przygranicznymi ujętymi w katalogu.

Aplikacja webowa (PWA) — mapa i katalog łowisk, dziennik połowów, niezbędnik wędkarza. Bez kont, bez reklam, bez subskrypcji. Dane osobiste (dziennik, ulubione) zostają na telefonie.

---

## 1. Cel produktu

Narzędzie regionalne dla wędkarza: szybko znaleźć łowisko, sprawdzić gospodarza, pogodę, wymiary ochronne i dojechać na miejsce. Nie jest urzędowym wykazem wód — przed wyjazdem obowiązuje regulamin gospodarza / PZW / GIRM / Wód Polskich.

**Dla kogo:** feederowcy, spinningiści, spławik, grunt, osoby planujące weekend nad wodą w Zachodniopomorskiem.

**Czego nie robi:** ogólnopolskiego katalogu, kont użytkowników, płatności w aplikacji, social feedu, czatu.

---

## 2. Zakres funkcjonalny

### 2.1 Mapa (ekran główny)

- Mapa OpenStreetMap Carto (`tile.openstreetmap.org`) — **lokalne nazwy polskie** (Szczecin, Świnoujście). Nie używać `openstreetmap.de` (tam pary DE/PL: Stettin, Swinemünde).
- Zapas kafelków: Wikimedia OSM-intl (też lokalne nazwy). Ciemna mapa = te same kafelki OSM, przyciemnione w CSS, bez API.
- Pinezki-rybki (canvas) dla widocznych łowisk; klastry przy zbliżeniu — lista w arkuszu.
- Filtry dolne: Lokalizacja, Wszystkie, Specjalne, Noc, Łodzie, Więcej (rodzaje wód + gatunki).
- Gatunki na mapie: szczupak, sandacz, okoń, sum, karp, lin, pstrąg potokowy, troć, węgorz, boleń. Kilka naraz = łowisko ma **wszystkie** (AND).
- Chipy aktywnych filtrów z „×”.
- Lokalizacja GPS (po zgodzie), pinezka „tu jestem”, sortowanie najbliższych.
- W centrum góry: licznik online, wiatr (km/h), **kompas** (N E S W + strzałka wiatru; tarcza z telefonem).
- Po prawej: pogoda, trend ciśnienia (animowana strzałka gdy spada/rośnie), ciemna mapa, offline, szukaj, menu (zapis na iPhone/Android, licencje).
- Zgoda RODO na pierwszym wejściu (niezbędne / lokalizacja).
- Telefon: **tylko pion**. W poziomie ekran „Obróć telefon w pion”. Tablet i komputer — bez blokady.
- Po loaderze mapa startuje dopiero przy realnym rozmiarze ramki; zasłona schodzi po wczytaniu katalogu.

### 2.2 Lista łowisk / PZW / Specjalne

Trzy zakładki dolnego menu z tym samym silnikiem listy, innym zakresem:

| Zakładka   | Zakres                                      |
|------------|---------------------------------------------|
| Łowiska    | cały katalog                                |
| PZW        | wody okręgów PZW (Szczecin, Koszalin, …)    |
| Specjalne  | nie-PZW: prywatne, komercyjne, GR, GIRM, WIR |

**Filtry górne (wyszarzane, gdy 0 wyników w zakresie):** Wszystkie, PZW, Specjalne, Jeziora, Stawy, Prywatne, Zalewy, Rzeki, Kanały, Morze, Komercyjne, Ulubione.

**Filtry gatunków:** te same 10 gatunków — przygaszone, jeśli w wybranym filtrze górnym nie występują. Zaznaczenie znika, gdy gatunku nie ma w puli.

**Obwody:** wyszukiwanie po numerze koła / obwodu (`86`, `005`, `J-89`, `R-12`). Chipy: Koła PZW, Jeziora J-, Rzeki R-. Grupy i chipy gasną, gdy w filtrze górnym ich nie ma.

**Sort:** A–Z, Największe (ha, potem km rzeki), Najbliższe (GPS), Ulubione.  
**Alfabet:** litery bez łowisk w bieżącym filtrze są wyciemnione.  
**Szukaj:** nazwa, alias, gmina, powiat, obwód, koło.

Karta na liście: rodzaj, nazwa (z gminą przy duplikatach), gmina/powiat/odległość, powierzchnia/głębokość, gatunki, gwiazdka ulubionych.

### 2.3 Karta łowiska

- Mini-mapa OSM, pogoda na kafelku, pełny ekran mapy.
- Opis, no-kill (komercyjne / specjalne / flaga `noKill`).
- Gospodarz: nazwa, telefon (`tel:`), strona, social (tylko żywe http/https), zezwolenie, cennik.
- Przycisk gospodarza → lista wszystkich jego wód.
- Współrzędne (kopiuj), pinezka Google (zielony przycisk).
- Gatunki:
  - **PZW:** chip z „i” — wymiar ochronny, sztuki na dobę, okres, widełki okręgu Szczecin/Koszalin.
  - **Prywatne i komercyjne:** tylko nazwa gatunku, **bez** wymiaru i limitu RAPR.
- Metody, noc, łodzie, silniki.
- Odległość + Nawiguj (Google).
- Dojazd, parking, zasady.
- Batymetria (gł. max / śr.), powierzchnia ha / długość km.
- Stan wody IMGW na rzekach (Odra, Rega, Drawa, …).
- 5 najbliższych łowisk.
- Porównaj (dwie karty obok siebie).
- Zapis z dziennika na tym łowisku.
- Martwe domeny gospodarzy nie są pokazywane.

### 2.4 Pogoda

Open-Meteo: temperatura, opad, wiatr i kierunek, wilgotność, ciśnienie i trend (w górę / w dół / stabilne), wschód/zachód, temperatura wody jeśli jest, 7 dni. Indeks żerowania (ciśnienie, wiatr, pora, księżyc).

### 2.5 Dziennik

Lokalny (localStorage). Wpis: gatunek, łowisko, cm, kg, metoda, notatka, data.  
Suma kg / sezon, rekord gatunku, eksport CSV. Szukanie po nazwie.

### 2.6 Niezbędnik

Zakładki: Gatunki (wymiary, limity, tarło — też morskie), Dokumenty (karta wędkarska, GIRM, WIR, koła, prywatne), Etykieta, Poradnik, Offline (paczka kafelków OSM), Zapis (powiadomienia tarło + skok stanu IMGW ≥ 30 cm), Ciasteczka / RODO, Kawa, **Licencje**, instrukcja **zapis na iPhone i Android**.

### 2.7 Inne

- **Porównanie** dwóch łowisk.
- **Lista gospodarza** po tapnięciu PZW / prywatnego na karcie.
- **Lista gatunku** z niezbędnika.
- **Online:** liczba otwartych sesji (bez tożsamości).
- **PWA:** dodaj do ekranu początkowego; orientation portrait w manifeście.

---

## 3. Dane

### 3.1 Katalog łowisk

- **1204** pozycji w `public/atlas/waters/00.json` … `49.json` (alfabetycznie, każdy plik **≤ 16 KB**).
- Manifest: `public/atlas/waters/index.json` (`n`, lista shardów).
- **Zakaz:** jednego dużego `waters.json` / `all.json` / `.bin` w `src/` lub `public/` — rozsadza workspace przy aktualizacji.
- Pola łowiska (skrót): `id`, `name`, `aliases`, `kind`, `powiat`, `gmina`, `okrag`, `tenure`, `lat`, `lng`, `areaHa`, `lengthKm`, `maxDepthM`, `avgDepthM`, `species[]`, `methods[]`, `night`, `boats`, `engines`, `featured`, `noKill`, `access`, `parking`, `summary`, `rules[]`, `ticket`, `website`, `socialUrl`, `obwod[]`.
- Rodzaje: jezioro, rzeka, zalew, morze, kanał, staw, komercyjne.
- Źródła pozycji: wykaz nazw wód stojących (gov.pl), geoportal.gov.pl / GUGiK, BDOT, Choiński (batymetria), strony PZW i gospodarzy. Opisy unikalne, bez cytowania „Źródło: …”.

### 3.2 Gatunki

31 gatunków w `src/data/species.json`: szczupak, sandacz, okoń, sum, węgorz, lin, leszcz, płoć, karaś, karp, amur, kleń, jaź, boleń, brzana, pstrąg potokowy, pstrąg tęczowy, lipień, troć, łosoś, miętus, sieja, sielawa, certa, wzdręga, krąp, stornia, śledź, dorsz, tołpyga, jesiotr.

Dla każdego: nazwa PL/łacina, `minCm`, `dailyLimit`, okresy `closed` / `seaClosed`, `seaBan`, `predators`. Wymiary i limity wg RAPR PZW + rozporządzenie; okręgi Szczecin/Koszalin mogą mieć widełki.

### 3.3 Gospodarze

`src/data/managers.json`: PZW okręgi, GR Ińsko, GR Czaplinek, PR Złocieniec, PR Szczecinek, JIS Wałcz, NTW, MTW, Modehpolmo, GIRM, Wody Polskie. Linki martwe są wycinane.

---

## 4. Nawigacja (IA)

```
Mapa
 ├─ Łowiska (lista)
 ├─ PZW          → lista wód okręgu / host-waters
 ├─ Specjalne    → lista nie-PZW / host-waters
 ├─ Dziennik
 └─ Niezbędnik
      Gatunki → lista łowisk gatunku
      Dokumenty, Etykieta, Poradnik
      Offline, Zapis (push)
      Ciasteczka, Licencje, Instalacja PWA, Kawa

Karta łowiska → porównanie | 5 najbliższych | gospodarz
```

Dolny pasek zawsze: Mapa, Łowiska, PZW, Specjalne, Dziennik, Niezbędnik.  
Gest wstecz od krawędzi na podstronach.

---

## 5. Technologia

| Warstwa        | Wybór |
|----------------|--------|
| UI             | React 19, TanStack Start / Router, Tailwind v4 |
| Stan           | Zustand (`src/lib/store.ts`) |
| Mapa           | Leaflet + własny canvas pinezek |
| Katalog        | JSON sharded, fetch w `loadCatalog()` |
| Pogoda         | Open-Meteo (klient) |
| Hydro          | IMGW-PIB, opcjonalnie cron + Web Push |
| Persistencja   | localStorage / sessionStorage / Cache API (offline) |
| Auth / baza    | **wyłączone** (brak kont) |
| PWA            | manifest, service worker, orientation: portrait |
| Hosting        | Vercel |

Kluczowe moduły: `catalog.ts`, `store.ts`, `MapCanvas.tsx`, `Chrome.tsx`, `SpotList.tsx`, `SpotDetail.tsx`, `Journal.tsx`, `Toolkit.tsx`, `weather.ts`, `hydro.ts`, `heading.ts`, `tiles.ts`.

---

## 6. Prywatność i zgody

- Brak trackerów reklamowych i analityki.
- Niezbędne: dziennik, ulubione, flaga loadera, paczka offline.
- Lokalizacja i kompas: tylko na urządzeniu, po zgodzie.
- Pogoda: współrzędne idą do Open-Meteo.
- Hydro: zapytania do IMGW; push bez lokalizacji użytkownika.
- Linki wychodzące: PZW, Facebook gospodarza, Instagram, Cuplink, Google Maps — polityki po ich stronie.

---

## 7. Licencje (w aplikacji)

OpenStreetMap (ODbL), Leaflet (BSD-2-Clause), Open-Meteo (CC BY 4.0), GUGiK / geoportal, RAPR PZW + rozporządzenie MRiRW, IMGW-PIB (dane publiczne).

---

## 8. Ograniczenia i zasady jakości

- Aplikacja **poglądowa**. Zawsze weryfikuj zezwolenie i regulamin.
- Katalog w shardach ≤ 16 KB; nigdy nie scalać do `all.json`.
- Telefony pionowo; kompas na desktopie stoi (brak magnetometru) — strzałka wiatru i tak działa, północ u góry.
- Na prywatnych/komercyjnych nie pokazywać wymiarów RAPR (gospodarz ma własne zasady, często no-kill).
- Martwych stron gospodarzy nie linkować.

---

## 9. Historia wersji (repozytoria)

Kolejne zrzuty GitHub `naryby12` … `naryby32` (właściciel: LukaszSzelemej).  
**naryby32:** OSM z polskimi nazwami, brak RAPR na kartach prywatnych/komercyjnych, mapa po loaderze, wygaszanie gatunków na liście, kompas, tylko pion na telefonie.

---

## 10. Metryki (stan naryby32)

| Metryka | Wartość |
|---------|---------|
| Łowiska | 1204 |
| Shardy katalogu | 50 (00–49) |
| Gatunki w niezbędniku | 31 |
| Gatunki-filtry mapy/listy | 10 |
| Kod + dane w git | ok. 2,4 MB |
| Katalog JSON | ok. 757 KB |
| Wersja UI | 1.8.0 |
