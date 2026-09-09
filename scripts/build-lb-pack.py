#!/usr/bin/env python3
"""Build public/atlas/packs/lb from PZW PDFs + OSM. Coords from OSM, else gmina center."""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path("/workspace")
SRC = Path("/tmp/lb")
OUT_WATERS = Path("/tmp/lb/out-waters.json")
OUT_MGR = Path("/tmp/lb/out-managers.json")
OUT_STOCK = Path("/tmp/lb/out-stocking.json")
OUT_MANIFEST = Path("/tmp/lb/out-manifest.json")
GEO_CACHE = Path("/tmp/lb/nominatim-cache.json")

BOUNDS = dict(south=51.22, west=14.40, north=53.15, east=16.42)
CENTER = (52.20, 15.35)

NIZ = [
    "szczupak", "sandacz", "okon", "leszcz", "ploc", "lin", "karas",
    "krap", "karp", "wzdręga",
]
RIVER_SP = [
    "szczupak", "okon", "leszcz", "ploc", "jaz", "klen", "bolen", "sum", "wegorz",
]
LAKE_M = ["spławik", "grunt", "spinning", "podlodowe"]
RIVER_M = ["spławik", "grunt", "spinning"]

PREFIX = re.compile(
    r"^(jezioro|jez|stawy|staw|zalew|zbiornik|kanal|kanał|rzeka|łowisko|lowisko)\s+",
    re.I,
)

GMINA_ALIAS = {
    "n bobrz": "Nowogród Bobrzański",
    "n. bobrz": "Nowogród Bobrzański",
    "nowogrod bob": "Nowogród Bobrzański",
    "nowogrod bobrz": "Nowogród Bobrzański",
    "nowogrod bobrzański": "Nowogród Bobrzański",
    "nowogrod bobrzanski": "Nowogród Bobrzański",
    "n miasteczko": "Nowe Miasteczko",
    "n. miasteczko": "Nowe Miasteczko",
    "krosno odrz": "Krosno Odrzańskie",
    "krosno odrz.": "Krosno Odrzańskie",
    "bytom odrz": "Bytom Odrzański",
    "bytom odrz.": "Bytom Odrzański",
    "brody zarskie": "Brody",
    "strzelce kraj": "Strzelce Krajeńskie",
    "strzelce kraj.": "Strzelce Krajeńskie",
    "gorzow wlkp": "Gorzów Wielkopolski",
    "gorzow wlkp.": "Gorzów Wielkopolski",
    "zielona gora": "Zielona Góra",
    "nowogrodek": "Nowogródek Pomorski",
    "lipinki luz": "Lipinki Łużyckie",
    "lipinki luz.": "Lipinki Łużyckie",
    "lubska": "Lubsko",
}

LUB_GMINA = {
    "gorzow wielkopolski", "zielona gora",
    "bogdaniec", "deszczno", "klodawa", "kostrzyn nad odra", "kostrzyn",
    "lubiszyn", "santok", "witnica",
    "bobrowice", "bytnica", "dabie", "gubin", "krosno odrzanskie", "maszewo",
    "bledzew", "miedzyrzecz", "przytoczna", "pszczew", "skwierzyna", "trzciel",
    "bytom odrzanski", "kolsko", "kozuchow", "nowa sol", "nowe miasteczko",
    "otyn", "siedlisko",
    "cybinka", "gorzyca", "osno lubuskie", "rzepin", "slubice",
    "dobiegniew", "drezdenko", "stare kurowo", "strzelce krajenskie", "zwierzyn",
    "krzeszyce", "lubniewice", "slonsk", "sulecin", "torzym",
    "lubrza", "lagow", "skape", "szczaniec", "swiebodzin", "zbaszynek",
    "slawa", "szlichtyngowa", "wschowa",
    "brzeznica", "gozdnica", "ilowa", "malomice", "niegoslawice", "szprotawa",
    "wymiarki", "zagan",
    "brody", "jasien", "lipinki luzyckie", "lubsko", "leknica", "przewoz",
    "trzebiel", "tuplice", "zary",
    "babimost", "bojadla", "czerwiensk", "kargowa", "nowogrod bobrzanski",
    "sulechow", "swidnica", "trzebiechow", "zabor",
    "murzynowo",
}

POWIAT = {
    "Gorzów Wielkopolski": "Gorzów Wielkopolski",
    "Zielona Góra": "Zielona Góra",
    "Bogdaniec": "Gorzów", "Deszczno": "Gorzów", "Kłodawa": "Gorzów",
    "Kostrzyn nad Odrą": "Gorzów", "Kostrzyn": "Gorzów", "Lubiszyn": "Gorzów",
    "Santok": "Gorzów", "Witnica": "Gorzów",
    "Bobrowice": "Krosno Odrzańskie", "Bytnica": "Krosno Odrzańskie",
    "Dąbie": "Krosno Odrzańskie", "Gubin": "Krosno Odrzańskie",
    "Krosno Odrzańskie": "Krosno Odrzańskie", "Maszewo": "Krosno Odrzańskie",
    "Bledzew": "Międzyrzecz", "Międzyrzecz": "Międzyrzecz",
    "Przytoczna": "Międzyrzecz", "Pszczew": "Międzyrzecz",
    "Skwierzyna": "Międzyrzecz", "Trzciel": "Międzyrzecz",
    "Bytom Odrzański": "Nowa Sól", "Kolsko": "Nowa Sól", "Kożuchów": "Nowa Sól",
    "Nowa Sól": "Nowa Sól", "Nowe Miasteczko": "Nowa Sól", "Otyń": "Nowa Sól",
    "Siedlisko": "Nowa Sól",
    "Cybinka": "Słubice", "Górzyca": "Słubice", "Ośno Lubuskie": "Słubice",
    "Rzepin": "Słubice", "Słubice": "Słubice",
    "Dobiegniew": "Strzelce Krajeńskie", "Drezdenko": "Strzelce Krajeńskie",
    "Stare Kurowo": "Strzelce Krajeńskie", "Strzelce Krajeńskie": "Strzelce Krajeńskie",
    "Zwierzyn": "Strzelce Krajeńskie",
    "Krzeszyce": "Sulęcin", "Lubniewice": "Sulęcin", "Słońsk": "Sulęcin",
    "Sulęcin": "Sulęcin", "Torzym": "Sulęcin",
    "Lubrza": "Świebodzin", "Łagów": "Świebodzin", "Skąpe": "Świebodzin",
    "Szczaniec": "Świebodzin", "Świebodzin": "Świebodzin", "Zbąszynek": "Świebodzin",
    "Sława": "Wschowa", "Szlichtyngowa": "Wschowa", "Wschowa": "Wschowa",
    "Brzeźnica": "Żagań", "Gozdnica": "Żagań", "Iłowa": "Żagań",
    "Małomice": "Żagań", "Niegosławice": "Żagań", "Szprotawa": "Żagań",
    "Wymiarki": "Żagań", "Żagań": "Żagań",
    "Brody": "Żary", "Jasień": "Żary", "Lipinki Łużyckie": "Żary",
    "Lubsko": "Żary", "Łęknica": "Żary", "Przewóz": "Żary", "Trzebiel": "Żary",
    "Tuplice": "Żary", "Żary": "Żary",
    "Babimost": "Zielona Góra", "Bojadła": "Zielona Góra", "Czerwieńsk": "Zielona Góra",
    "Kargowa": "Zielona Góra", "Nowogród Bobrzański": "Zielona Góra",
    "Sulechów": "Zielona Góra", "Świdnica": "Zielona Góra",
    "Trzebiechów": "Zielona Góra", "Zabór": "Zielona Góra",
    "Murzynowo": "Międzyrzecz",
}

GMINA_XY = {
    "Bobrowice": (51.953, 15.090), "Bytnica": (52.151, 15.169), "Dąbie": (52.013, 15.154),
    "Gubin": (51.954, 14.728), "Krosno Odrzańskie": (52.055, 15.099), "Maszewo": (52.077, 15.061),
    "Bledzew": (52.518, 15.414), "Międzyrzecz": (52.445, 15.578), "Przytoczna": (52.578, 15.678),
    "Pszczew": (52.477, 15.782), "Skwierzyna": (52.599, 15.505), "Trzciel": (52.365, 15.873),
    "Bytom Odrzański": (51.730, 15.823), "Kolsko": (51.958, 15.968), "Kożuchów": (51.745, 15.595),
    "Nowa Sól": (51.803, 15.717), "Nowe Miasteczko": (51.690, 15.731), "Otyń": (51.847, 15.710),
    "Siedlisko": (51.768, 15.812), "Cybinka": (52.194, 14.796), "Ośno Lubuskie": (52.454, 14.876),
    "Rzepin": (52.347, 14.832), "Słubice": (52.351, 14.560), "Dobiegniew": (52.969, 15.754),
    "Drezdenko": (52.838, 15.831), "Strzelce Krajeńskie": (52.877, 15.532), "Zwierzyn": (52.832, 15.582),
    "Krzeszyce": (52.583, 15.006), "Lubniewice": (52.513, 15.250), "Słońsk": (52.563, 14.805),
    "Sulęcin": (52.444, 15.116), "Torzym": (52.313, 15.075), "Lubrza": (52.305, 15.410),
    "Łagów": (52.334, 15.292), "Skąpe": (52.153, 15.459), "Świebodzin": (52.247, 15.533),
    "Sława": (51.881, 16.072), "Brzeźnica": (51.716, 15.404), "Iłowa": (51.501, 15.206),
    "Małomice": (51.557, 15.450), "Szprotawa": (51.566, 15.537), "Wymiarki": (51.511, 15.081),
    "Żagań": (51.617, 15.315), "Brody": (51.790, 14.770), "Jasień": (51.751, 15.014),
    "Lubsko": (51.787, 14.972), "Przewóz": (51.480, 14.952), "Trzebiel": (51.636, 14.816),
    "Tuplice": (51.677, 14.853), "Żary": (51.643, 15.137), "Babimost": (52.165, 15.827),
    "Bojadła": (51.953, 15.820), "Czerwieńsk": (52.012, 15.423), "Kargowa": (52.073, 15.865),
    "Nowogród Bobrzański": (51.802, 15.235), "Sulechów": (52.084, 15.625), "Świdnica": (51.888, 15.400),
    "Trzebiechów": (52.021, 15.736), "Zabór": (51.962, 15.715), "Zielona Góra": (51.935, 15.506),
    "Gorzów Wielkopolski": (52.731, 15.240), "Deszczno": (52.669, 15.318), "Kłodawa": (52.791, 15.214),
    "Lubiszyn": (52.784, 14.953), "Santok": (52.738, 15.410), "Witnica": (52.673, 14.897),
    "Gozdnica": (51.439, 15.099), "Niegosławice": (51.609, 15.717), "Zbąszynek": (52.243, 15.817),
    "Szczaniec": (52.273, 15.686), "Stare Kurowo": (52.856, 15.677),
    "Górzyca": (52.494, 14.655), "Wschowa": (51.807, 16.317), "Szlichtyngowa": (51.712, 16.245),
    "Kostrzyn nad Odrą": (52.588, 14.650), "Łęknica": (51.537, 14.736),
    "Lipinki Łużyckie": (51.645, 15.079), "Bogdaniec": (52.688, 15.071),
}


def fold(s: str) -> str:
    s = (s or "").lower()
    table = str.maketrans("ąćęłńóśźżäöüß", "acelnoszzaous")
    s = s.translate(table)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def core(s: str) -> str:
    s = fold(s)
    s = PREFIX.sub("", s)
    s = s.replace(" wlkp", "").replace(" wlk", " wielkie").replace(" mal", " male")
    s = re.sub(r"\b(glinianka|glinianki|wyrobisko|wyrobiska|zwir|zwirownia|starorzecze|starorzecza)\b", "", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_ha(s: str) -> float | None:
    s = (s or "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        v = float(s)
        return v if v > 0 else None
    except ValueError:
        return None


def canon_gmina(raw: str) -> str:
    raw = re.sub(r"\s+", " ", (raw or "").strip(" .,"))
    raw = re.split(r"[,;]| oraz ", raw)[0].strip()
    raw = re.sub(r"\s+\d.*$", "", raw)
    key = fold(raw)
    if key in GMINA_ALIAS:
        return GMINA_ALIAS[key]
    return raw


def gmina_ok(g: str) -> bool:
    parts = re.split(r"[,;/]| oraz ", g or "")
    hits = [fold(canon_gmina(p)) for p in parts if p.strip()]
    if not hits:
        return True
    if any(h in LUB_GMINA for h in hits):
        return True
    return False


def near_gmina(lat: float, lng: float, gmina: str) -> bool:
    xy = GMINA_XY.get(canon_gmina(gmina))
    if not xy:
        return True
    return (lat - xy[0]) ** 2 + (lng - xy[1]) ** 2 < 0.55 ** 2


def in_bounds(lat: float, lng: float) -> bool:
    return BOUNDS["south"] <= lat <= BOUNDS["north"] and BOUNDS["west"] <= lng <= BOUNDS["east"]


def aliases_of(name: str) -> list[str]:
    als = []
    primary = re.sub(r"\s*\([^)]*\)", "", name).strip()
    if primary:
        als.append(primary)
    for m in re.findall(r"\(([^)]+)\)", name):
        for part in re.split(r"[/;,]", m):
            part = part.strip(" .")
            if part and fold(part) not in ("zalany", "glinian", "jez", "jezioro"):
                als.append(part)
    seen, out = set(), []
    for a in als:
        k = core(a)
        if k and k not in seen:
            seen.add(k)
            out.append(a)
    return out


def slug(name: str, gmina: str = "") -> str:
    base = core(name) or fold(name)
    s = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return (s or "woda")[:48]


def clean_water_name(raw: str) -> str:
    s = re.sub(r"([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])-\s+([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])", r"\1\2", s)
    s = s.replace("N. Miasteczko", "Nowe Miasteczko")
    s = s.replace("/Portki/", "(Portki)").replace("/", " ")
    s = re.sub(r"\s*\*+$", "", s)
    s = re.sub(
        r"\s*[-–—]\s*(glinian.*|jez\.?|jezioro|zalew|zb\.?|2 zb.*|wyrob.*|staro.*|zwir.*|żwir.*|\bj\b)$",
        "",
        s,
        flags=re.I,
    )
    s = s.replace("-jezioro", "").replace("-jez.", "").replace("-zalew", "")
    s = s.replace(" Wlk.", " Wielkie").replace(" Wlk ", " Wielkie ")
    if s.endswith(" Wlk"):
        s = s[: -4] + " Wielkie"
    return s.strip(" .-")


def kind_from(name: str, section: str) -> str:
    f = fold(name)
    if section == "zalew" or "zalew" in f or "zaporow" in f or "zb zapor" in f:
        return "zalew"
    if section == "rzeka" or f.startswith("rzeka ") or " od ujscia" in f or " od mostu" in f:
        if "kanal" in f:
            return "kanal"
        return "rzeka"
    if any(x in f for x in ("staw", "glinian", "wyrobisk", "zwir", "wapno", "wapna")):
        return "staw"
    if "kanal" in f:
        return "kanal"
    return "jezioro"


def display_name(name: str, kind: str) -> str:
    n = clean_water_name(name)
    if kind == "jezioro" and not PREFIX.match(n) and not fold(n).startswith("jezioro"):
        return f"Jezioro {n}"
    return n


RIVER_HEAD = re.compile(
    r"^(Odra|Bóbr|Nysa Łużycka|Warta|Noteć|Obra|Obrzyca|Lubsza|Kwisa|Ilanka|"
    r"Gryżynka|Gniła Obra|Postomia|Kłodawka|Marwica|Srebrna|Łęcza|Pełcz|Pliszka|"
    r"Szprotawa|Brzeźnica|Czerna Wielka|Czarna Struga|Stara Odra)\b",
    re.I,
)

FAMOUS_RIVER = re.compile(
    r"^(Odra|Bóbr|Nysa|Warta|Noteć|Obra|Obrzyca|Lubsza|Kwisa|Ilanka|Gryżynka|"
    r"Gniła Obra|Postomia|Pliszka|Kłodawka|Marwica|Srebrna|Łęcza|Pełcz|Stara Odra)",
    re.I,
)


def short_river(name: str) -> str:
    m = RIVER_HEAD.match(name.strip())
    return m.group(1) if m else name


def load_osm():
    idx = defaultdict(list)
    for fname, kind_hint in (("osm-lakes.json", "lake"), ("osm-other.json", "other"), ("osm-rivers.json", "river")):
        data = json.loads((SRC / fname).read_text())
        for e in data.get("elements", []):
            tags = e.get("tags") or {}
            c = e.get("center") or {}
            lat = c.get("lat") if c else e.get("lat")
            lon = c.get("lon") if c else e.get("lon")
            if lat is None or lon is None:
                continue
            rec = {
                "lat": float(lat),
                "lng": float(lon),
                "tags": tags,
                "hint": kind_hint,
                "id": e.get("id"),
            }
            names = []
            for k in ("name", "name:pl", "alt_name", "alt_name:pl", "loc_name", "official_name"):
                if tags.get(k):
                    for piece in re.split(r"[;,]", tags[k]):
                        piece = piece.strip()
                        if piece:
                            names.append(piece)
            for n in names:
                for a in aliases_of(n) + [n]:
                    key = core(a)
                    if key:
                        idx[key].append(rec)
    return idx


def pick_osm(name: str, kind: str, idx, used: set, gmina: str = "") -> dict | None:
    keys = [core(a) for a in aliases_of(name)]
    keys.append(core(name))
    keys = [k for k in keys if len(k) >= 3]
    cands = []
    for k in keys:
        for rec in idx.get(k, []):
            if rec["id"] in used:
                continue
            if not in_bounds(rec["lat"], rec["lng"]):
                continue
            if gmina and not near_gmina(rec["lat"], rec["lng"], gmina):
                continue
            cands.append((k, rec))
    if not cands:
        for k in keys:
            if len(k) < 6:
                continue
            hits = []
            for ik, recs in idx.items():
                if ik == k or ik.startswith(k + " ") or k.startswith(ik + " "):
                    hits.extend(recs)
            hits = [
                h
                for h in hits
                if h["id"] not in used
                and in_bounds(h["lat"], h["lng"])
                and (not gmina or near_gmina(h["lat"], h["lng"], gmina))
            ]
            if len({h["id"] for h in hits}) == 1:
                cands = [(k, hits[0])]
                break
    if not cands:
        return None

    def score(item):
        k, rec = item
        sc = 0
        t = rec["tags"]
        wn = core(t.get("name") or "")
        if wn == k:
            sc += 10
        if kind in ("jezioro", "zalew", "staw") and rec["hint"] != "river":
            sc += 3
        if kind == "rzeka" and rec["hint"] == "river":
            sc += 5
        if rec["hint"] == "lake":
            sc += 1
        if gmina:
            xy = GMINA_XY.get(canon_gmina(gmina))
            if xy:
                sc -= ((rec["lat"] - xy[0]) ** 2 + (rec["lng"] - xy[1]) ** 2)
        return sc

    cands.sort(key=score, reverse=True)
    return cands[0][1]


def load_geo_cache():
    if GEO_CACHE.exists():
        return json.loads(GEO_CACHE.read_text())
    return {}


def save_geo_cache(cache):
    GEO_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=0))


def nominatim(name: str, gmina: str, kind: str, cache: dict) -> dict | None:
    head = short_river(name) if kind in ("rzeka", "kanal") else clean_water_name(name)
    als = aliases_of(name)
    primary = als[0] if als else head
    kind_word = "rzeka" if kind in ("rzeka", "kanal") else "jezioro"
    variants = []
    if gmina:
        variants.append(f"{primary}, {gmina}, województwo lubuskie")
        variants.append(f"{kind_word} {primary}, {gmina}, lubuskie")
    variants.append(f"{primary} {kind_word} lubuskie")
    seen = set()
    for q in variants:
        q = re.sub(r"\s+", " ", q).strip(" ,")
        if not q or q in seen:
            continue
        seen.add(q)
        if q in cache:
            if cache[q]:
                return cache[q]
            continue
        params = urllib.parse.urlencode(
            {"q": q, "format": "json", "limit": "3", "countrycodes": "pl"}
        )
        url = "https://nominatim.openstreetmap.org/search?" + params
        req = urllib.request.Request(
            url, headers={"User-Agent": "AtlasWedkarski/2.1 (naryby; atlaswedkarski.pl)"}
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as res:
                data = json.loads(res.read().decode())
        except Exception as e:
            print("nominatim fail", q, e)
            cache[q] = None
            time.sleep(1.05)
            continue
        time.sleep(1.05)
        hit = None
        for d in data:
            lat, lng = float(d["lat"]), float(d["lon"])
            if not in_bounds(lat, lng):
                continue
            disp = fold(d.get("display_name") or "")
            if "lubuskie" not in disp and gmina and fold(gmina) not in disp:
                continue
            hit = {"lat": lat, "lng": lng}
            break
        cache[q] = hit
        if hit:
            return hit
    return None


def fallback_xy(name: str, gmina: str) -> tuple[float, float]:
    xy = GMINA_XY.get(canon_gmina(gmina)) or CENTER
    h = hashlib.md5(f"{name}|{gmina}".encode()).digest()
    dy = (h[0] - 128) / 128 * 0.028
    dx = (h[1] - 128) / 128 * 0.036
    lat, lng = xy[0] + dy, xy[1] + dx
    lat = min(max(lat, BOUNDS["south"] + 0.02), BOUNDS["north"] - 0.02)
    lng = min(max(lng, BOUNDS["west"] + 0.02), BOUNDS["east"] - 0.02)
    return lat, lng


def read(name: str) -> str:
    return (SRC / "extract" / name).read_text(encoding="utf-8", errors="replace")


def numbered_rows(chunk: str) -> list[str]:
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in chunk.splitlines()]
    buf, rows = "", []
    for ln in lines:
        if not ln or ln.startswith("Lp.") or "Szczegółowy" in ln:
            continue
        if re.match(r"^\d+\.?\s", ln):
            if buf:
                rows.append(buf)
            buf = ln
        elif buf:
            buf += " " + ln
    if buf:
        rows.append(buf)
    return rows


def parse_named_ha_gmina(rows: list[str], src: str, section: str) -> list[dict]:
    out = []
    for r in rows:
        m = re.match(r"^(\d+)\.?\s+(.+?)\s+(\d+,\d+|\d+)\s+(.+)$", r)
        if not m:
            continue
        name = clean_water_name(m.group(2))
        if not name or name.lower().startswith(("oraz cieki", "oraz dopływ", "lp.")):
            continue
        gmina = canon_gmina(m.group(4))
        out.append(
            {
                "name": name,
                "areaHa": parse_ha(m.group(3)),
                "gmina": gmina,
                "src": src,
                "kind": kind_from(name, section),
            }
        )
    return out


def parse_zg_lakes(text: str) -> list[dict]:
    if "A. Jeziora" not in text:
        chunk = text
    else:
        chunk = text.split("A. Jeziora", 1)[1]
        chunk = re.split(r"\nB\.\s+Rzeki", chunk, maxsplit=1)[0]
    return parse_named_ha_gmina(numbered_rows(chunk), "zg", "jezioro")


def parse_zg_cd(text: str) -> list[dict]:
    out = []
    if "C. Zbiorniki" in text:
        chunk = text.split("C. Zbiorniki", 1)[1]
        chunk = re.split(r"\nD\.\s+", chunk, maxsplit=1)[0]
        out.extend(parse_named_ha_gmina(numbered_rows(chunk), "zg-zalew", "zalew"))
    if "D. Drobne wody" in text:
        chunk = text.split("D. Drobne wody", 1)[1]
        out.extend(parse_named_ha_gmina(numbered_rows(chunk), "zg-drobne", "jezioro"))
    return out


def parse_zg_rivers(text: str) -> list[dict]:
    if "B. Rzeki" not in text:
        return []
    chunk = text.split("B. Rzeki", 1)[1]
    chunk = re.split(r"\nC\.\s+Zbiorniki", chunk, maxsplit=1)[0]
    out = []
    for r in numbered_rows(chunk):
        m = re.match(r"^(\d+)\.?\s+(.+)$", r)
        if not m:
            continue
        body = m.group(2)
        hm = re.search(r"(\d+,\d+|\d+)\s+([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż].+)$", body)
        if not hm:
            continue
        name = clean_water_name(body[: hm.start()].strip(" .,"))
        if not name or name.lower().startswith(("oraz cieki", "oraz dopływ")):
            continue
        ha = parse_ha(hm.group(1))
        gmina_raw = hm.group(2)
        gmina_raw = re.sub(r"\s+\d.*$", "", gmina_raw)
        gmina_raw = re.sub(r"\s+(Pk|R|G|Łs|O)\b.*$", "", gmina_raw)
        gmina = canon_gmina(gmina_raw)
        if ha is not None and ha < 8 and not FAMOUS_RIVER.match(name):
            continue
        out.append(
            {
                "name": name,
                "areaHa": ha,
                "gmina": gmina,
                "src": "zg-rzeka",
                "kind": kind_from(name, "rzeka"),
            }
        )
    return out


def parse_zezw_flags(text: str) -> dict[tuple[str, str], str]:
    if "WYKAZ JEZIOR" not in text:
        chunk = text
    else:
        chunk = text.split("WYKAZ JEZIOR", 1)[1]
        chunk = re.split(r"II\.\s+WYKAZ RZEK", chunk, maxsplit=1)[0]
    flags = {}
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in chunk.splitlines()]
    buf = ""
    rows = []
    for ln in lines:
        if not ln or ln.startswith("Nr") or ln.startswith("Ł.") or ln.startswith("- "):
            continue
        if re.search(r"\b(ZP|ZPS)\b", ln) or re.match(r"^\d+\s+\S", ln) or buf:
            if re.search(r"\b(ZPS|ZP)\b", ln) or re.search(r"\d+,\d+", ln):
                rows.append((buf + " " + ln).strip())
                buf = ""
            else:
                buf += " " + ln
    for r in rows:
        fm = re.search(r"\b(ZPS|ZP)\b", r)
        if not fm:
            continue
        flag = fm.group(1)
        left = r[: fm.start()].strip()
        hm = re.search(r"(\d+,\d+|\d+)\s+(.+)$", left)
        if not hm:
            continue
        name = clean_water_name(re.sub(r"^\d+\s+", "", left[: hm.start()]).strip())
        gmina = canon_gmina(hm.group(2))
        flags[(core(name), fold(gmina))] = flag
        flags[(core(name), "")] = flags.get((core(name), ""), flag)
    return flags


def parse_gorzow(text: str) -> list[dict]:
    blob = re.sub(r"\s+", " ", text)
    parts = re.split(r"(?=\b\d{1,3}\.\s)", blob)
    out = []
    seen = set()
    for part in parts:
        m = re.match(r"^(\d+)\.\s+(.+)$", part.strip())
        if not m:
            continue
        n = int(m.group(1))
        body = m.group(2).strip()
        if n <= 160 or n == 173:
            hm = re.search(
                r"^(.*?)\s+(\d+,\d+|\d+)\s+([A-ZĄĆĘŁŃÓŚŹŻ][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż.\-]*(?:\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż.\-]{0,12}){0,3})\s+(\d+|b/n)\b",
                body,
            )
            if n == 173 and not hm:
                name = clean_water_name(re.sub(r"^jezioro\s+", "", body, flags=re.I).split("gmina")[0])
                gmina = "Lubniewice"
                ha = None
                gm = re.search(r"gmina\s+([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+)", body)
                if gm:
                    gmina = canon_gmina(gm.group(1))
                out.append({"name": name or "Lubiąż", "areaHa": ha, "gmina": gmina, "src": "gorzow", "kind": "jezioro"})
                continue
            if not hm:
                continue
            name = clean_water_name(hm.group(1))
            gmina = canon_gmina(hm.group(3))
            key = (core(name), fold(gmina))
            if key in seen:
                continue
            seen.add(key)
            out.append(
                {
                    "name": name,
                    "areaHa": parse_ha(hm.group(2)),
                    "gmina": gmina,
                    "src": "gorzow",
                    "kind": kind_from(name, "jezioro"),
                }
            )
        else:
            if not re.search(r"\brzeka\b", body, re.I) and n < 161:
                continue
            name = clean_water_name(body)
            name = re.sub(r"^rzeka\s+", "", name, flags=re.I)
            name = re.split(r"\s+na odcinku|\s+od |\s+z wyłączeniem", name, maxsplit=1)[0]
            hm = re.search(r"(\d+,\d+)", body)
            f = fold(name)
            if any(x in f for x in ("mysla", "drawa", "slopica")):
                continue
            if not name:
                continue
            key = ("r:" + core(name),)
            if key in seen:
                continue
            seen.add(key)
            gmina = "Gorzów Wielkopolski"
            if "santok" in f or "notec" in f:
                gmina = "Santok"
            elif "bledzew" in f or fold(name).startswith("obra"):
                gmina = "Bledzew"
            elif "krzeszyc" in f or "postomia" in f:
                gmina = "Krzeszyce"
            elif "rzepin" in f or "ilanka" in f:
                gmina = "Rzepin"
            elif fold(name).startswith("odra"):
                gmina = "Słubice"
            elif fold(name).startswith("warta"):
                gmina = "Gorzów Wielkopolski"
            elif "klodawk" in f or "marwic" in f or "srebrn" in f:
                gmina = "Gorzów Wielkopolski"
            elif "pelcz" in f:
                gmina = "Strzelce Krajeńskie"
            out.append(
                {
                    "name": name,
                    "areaHa": parse_ha(hm.group(1)) if hm else None,
                    "gmina": gmina,
                    "src": "gorzow-rzeka",
                    "kind": "rzeka",
                }
            )
    return out


def parse_zaryb(text: str) -> list[dict]:
    cols = ["karp", "lin", "karas", "szczupak", "jaz", "sandacz", "ploc", "leszcz", "wegorz"]
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.splitlines() if ln.strip()]
    rows = []
    for ln in lines:
        if ln.startswith("Nazwa") or ln.startswith("Karp") or ln.startswith("Lin") or ln.startswith("Wykonanie"):
            continue
        compact = re.sub(r"(\d) (\d{3})\b", r"\1\2", ln)
        compact = re.sub(r"(\d) (\d{3})\b", r"\1\2", compact)
        m = re.match(r"^(.+?)\s+((?:\d+\s*)+)$", compact)
        if not m:
            continue
        name = clean_water_name(m.group(1))
        nums = [int(x) for x in m.group(2).split() if x.isdigit()]
        if len(nums) < 2:
            continue
        vals = nums[:-1]
        species = []
        for i, v in enumerate(vals):
            if v > 0 and i < len(cols):
                species.append(cols[i])
        if "ploc" in species:
            species.append("wzdręga")
        if species:
            rows.append({"name": name, "species": species, "year": 2025, "source": "zg2025"})
    return rows


SLAWA = [
    dict(name="Sławskie", aliases=["Sława", "Jezioro Sława"], gmina="Sława", areaHa=817, boats=True, night=True, featured=True),
    dict(name="Tarnowskie Duże", gmina="Sława", boats=True, night=True),
    dict(name="Młyńskie Duże", aliases=["Głuchowskie Duże"], gmina="Sława", boats=True, night=True),
    dict(name="Radzyńska Struga", aliases=["Kopalnia"], gmina="Sława", boats=True, night=True, kind="zalew"),
    dict(name="Tarnowskie Małe", gmina="Sława", boats=False, night=True),
    dict(name="Kuźnickie", aliases=["Błotne"], gmina="Sława", boats=False, night=True),
    dict(name="Brzezie", aliases=["Radzyńskie"], gmina="Sława", boats=False, night=True),
    dict(name="Steklno Górne", aliases=["Droniki"], gmina="Sława", boats=False, night=True),
    dict(name="Steklno Dolne", aliases=["Nowa Rola"], gmina="Sława", boats=False, night=True),
    dict(name="Młyńskie Małe", gmina="Sława", boats=False, night=True),
]


def uniq_id(base: str, taken: set, gmina: str = "") -> str:
    s = base or "woda"
    if s not in taken:
        taken.add(s)
        return s
    g = re.sub(r"[^a-z0-9]+", "-", fold(gmina)).strip("-")
    s2 = f"{s}-{g}" if g else s
    if s2 not in taken:
        taken.add(s2)
        return s2
    i = 2
    while f"{s}-{i}" in taken:
        i += 1
    s3 = f"{s}-{i}"
    taken.add(s3)
    return s3


def main():
    idx = load_osm()
    zg_txt = read("wykaz-zg.pdf.txt")
    zezw_txt = read("zezw-zg.pdf.txt")
    gor_txt = read("wykaz-gorzow.pdf.txt")
    zaryb_txt = read("zaryb-zg.pdf.txt")
    flags = parse_zezw_flags(zezw_txt)
    zg_lakes = parse_zg_lakes(zg_txt)
    zg_cd = parse_zg_cd(zg_txt)
    zg_rivers = parse_zg_rivers(zg_txt)
    gor = parse_gorzow(gor_txt)
    zaryb = parse_zaryb(zaryb_txt)
    print(
        "parsed zg lakes", len(zg_lakes),
        "zg cd", len(zg_cd),
        "zg rivers", len(zg_rivers),
        "gorzow", len(gor),
        "flags", len(flags),
        "zaryb", len(zaryb),
    )

    raw = []
    have = set()

    def add(w):
        key = (core(w["name"]), fold(w.get("gmina") or ""), w.get("host"))
        if key in have:
            return
        have.add(key)
        raw.append(w)

    for w in zg_lakes:
        w["kind"] = w.get("kind") or kind_from(w["name"], "jezioro")
        w["host"] = "pzw-zielona-gora"
        w["okrag"] = "Zielona Góra"
        add(w)
    for w in zg_cd:
        w["host"] = "pzw-zielona-gora"
        w["okrag"] = "Zielona Góra"
        add(w)

    lines = [re.sub(r"\s+", " ", ln).strip() for ln in zezw_txt.split("WYKAZ JEZIOR", 1)[-1].split("II. WYKAZ RZEK", 1)[0].splitlines()]
    buf = ""
    extra_zezw = 0
    for ln in lines:
        if not ln or ln.startswith("Nr") or ln.startswith("Ł."):
            continue
        buf = (buf + " " + ln).strip()
        fm = re.search(r"\b(ZPS|ZP)\b", buf)
        if not fm:
            continue
        left = buf[: fm.start()].strip()
        hm = re.search(r"(\d+,\d+|\d+)\s+(.+)$", left)
        buf = ""
        if not hm:
            continue
        name = clean_water_name(re.sub(r"^\d+\s+", "", left[: hm.start()]))
        gmina = canon_gmina(hm.group(2))
        if re.search(r"gmina inne|\(ha\)|zbiornikow|wykaz jezior", fold(name)):
            continue
        if len(core(name)) < 3:
            continue
        if (core(name), fold(gmina), "pzw-zielona-gora") in have:
            continue
        extra_zezw += 1
        add(
            {
                "name": name,
                "areaHa": parse_ha(hm.group(1)),
                "gmina": gmina,
                "src": "zg-zezw",
                "kind": kind_from(name, "jezioro"),
                "host": "pzw-zielona-gora",
                "okrag": "Zielona Góra",
            }
        )
    print("extra zezw", extra_zezw)

    for w in zg_rivers:
        if w.get("kind") in ("rzeka", "kanal"):
            w["name"] = short_river(w["name"])
        w["host"] = "pzw-zielona-gora"
        w["okrag"] = "Zielona Góra"
        add(w)

    for w in gor:
        if not gmina_ok(w.get("gmina") or ""):
            continue
        w["host"] = "pzw-gorzow"
        w["okrag"] = "Gorzów"
        add(w)

    for w in SLAWA:
        add(
            {
                "name": w["name"],
                "aliases": w.get("aliases"),
                "gmina": w["gmina"],
                "areaHa": w.get("areaHa"),
                "src": "gr-slawa",
                "kind": w.get("kind") or "jezioro",
                "host": "gr-slawa",
                "okrag": None,
                "boats": w.get("boats"),
                "night": w.get("night"),
                "featured": w.get("featured"),
            }
        )

    kept = []
    for w in raw:
        if w.get("src") == "gr-slawa":
            kept.append(w)
            continue
        if w.get("gmina") and not gmina_ok(w["gmina"]):
            continue
        kept.append(w)
    print("after gmina filter", len(kept))

    cache = load_geo_cache()
    used_osm = set()
    waters = []
    taken_ids: set[str] = set()
    host_by_id = {}
    approx = 0

    for i, w in enumerate(kept):
        if i and i % 40 == 0:
            save_geo_cache(cache)
            print(f"… {i}/{len(kept)} geocoded={len(waters)} approx={approx}")
        kind = w.get("kind") or kind_from(w["name"], "jezioro")
        search_name = short_river(w["name"]) if kind in ("rzeka", "kanal") else w["name"]
        rec = pick_osm(search_name, kind, idx, used_osm, w.get("gmina") or "")
        if rec is None and w.get("aliases"):
            for a in w["aliases"]:
                rec = pick_osm(a, kind, idx, used_osm, w.get("gmina") or "")
                if rec:
                    break
        lat = lng = None
        approx_flag = False
        if rec:
            lat, lng = rec["lat"], rec["lng"]
            used_osm.add(rec["id"])
        elif (w.get("areaHa") or 0) >= 8 or w.get("src") == "gr-slawa" or kind in ("rzeka", "zalew"):
            hit = nominatim(search_name, w.get("gmina") or "", kind, cache)
            if hit:
                lat, lng = hit["lat"], hit["lng"]
        if lat is None:
            lat, lng = fallback_xy(w["name"], w.get("gmina") or "")
            approx_flag = True
            approx += 1
        shown = short_river(w["name"]) if kind in ("rzeka", "kanal") else w["name"]
        name = display_name(shown, kind)
        als = aliases_of(w["name"])
        if w.get("aliases"):
            als = list(dict.fromkeys(als + w["aliases"]))
        als = [a for a in als if fold(a) != fold(name) and fold(a) != fold(PREFIX.sub("", name))]
        gmina = canon_gmina(w.get("gmina") or "")
        powiat = POWIAT.get(gmina, gmina or "Lubuskie")
        wid = uniq_id(slug(name, gmina), taken_ids, gmina)
        flag = flags.get((core(w["name"]), fold(gmina))) or flags.get((core(w["name"]), ""))
        boats = w.get("boats")
        engines = None
        if boats is None:
            if flag == "ZP":
                boats = False
            elif flag == "ZPS":
                boats = True
                engines = "bez spalinowego"
            elif kind in ("rzeka", "zalew") and (w.get("areaHa") or 0) >= 20:
                boats = True
            else:
                boats = False
        night = w.get("night")
        if night is None:
            night = False
        rules = []
        if w.get("host") == "pzw-zielona-gora":
            rules.append("Wymagane zezwolenie Okręgu PZW Zielona Góra.")
            if flag == "ZP":
                rules.append("Zakaz amatorskiego połowu ze środków pływających (ZP).")
            elif flag == "ZPS":
                rules.append("Zakaz silnika spalinowego (ZPS) — jednostki bez silnika spalinowego dozwolone według zezwolenia.")
        elif w.get("host") == "pzw-gorzow":
            rules.append("Wymagane zezwolenie Okręgu PZW Gorzów Wielkopolski.")
        elif w.get("host") == "gr-slawa":
            rules.append("Karnet Gospodarstwa Rybackiego Sława. Zakaz trollingu. Połów na dwie wędki albo jeden spinning.")
            if boats is False:
                rules.append("Tylko z brzegu — bez łodzi.")
            else:
                rules.append("Z łodzi od 15.05 do 11.11, z brzegu cały rok (całą dobę 1.04–30.11).")
        if approx_flag:
            rules.append("Pin na mapie przybliżony do gminy — sprawdź dojazd na miejscu.")
        species = list(RIVER_SP if kind in ("rzeka", "kanal") else NIZ)
        if w.get("featured"):
            species = list(dict.fromkeys(species + ["sum", "wegorz", "bolen"]))
        kind_pl = {"rzeka": "Rzeka", "kanal": "Kanał", "zalew": "Zalew", "staw": "Staw"}.get(kind, "Jezioro")
        host_pl = (
            " Wody Okręgu PZW Zielona Góra."
            if w.get("host") == "pzw-zielona-gora"
            else " Wody Okręgu PZW Gorzów Wielkopolski."
            if w.get("host") == "pzw-gorzow"
            else " Obwód Gospodarstwa Rybackiego Sława."
            if w.get("host") == "gr-slawa"
            else ""
        )
        water = {
            "id": wid,
            "name": name,
            "kind": kind,
            "powiat": powiat,
            "gmina": gmina or None,
            "okrag": w.get("okrag"),
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "areaHa": w.get("areaHa"),
            "species": species,
            "methods": list(RIVER_M if kind in ("rzeka", "kanal") else LAKE_M),
            "night": bool(night),
            "boats": bool(boats),
            "summary": f"{kind_pl} w gminie {gmina or powiat}.{host_pl}",
            "rules": rules,
        }
        if als:
            water["aliases"] = als[:4]
        if w.get("featured"):
            water["featured"] = True
        if engines:
            water["engines"] = engines
        if not water.get("gmina"):
            water.pop("gmina", None)
        if not water.get("okrag"):
            water.pop("okrag", None)
        if not water.get("areaHa"):
            water.pop("areaHa", None)
        waters.append(water)
        if w.get("host"):
            host_by_id[wid] = w["host"]

    save_geo_cache(cache)
    print("geocoded", len(waters), "approx", approx)

    managers = {
        "pzw-zielona-gora": {
            "id": "pzw-zielona-gora",
            "name": "Okręg PZW w Zielonej Górze",
            "shortName": "PZW Zielona Góra",
            "website": "https://zozgora.pzw.pl/",
            "permitUrl": "https://zezwolenia.pzw.zgora.pl/",
            "permitLabel": "Wymagane zezwolenie",
            "priceUrl": "https://zozgora.pzw.pl/strefa-wedkarza/e-zezwolenie-zaplac-za-wedkowanie",
            "priceLabel": "E-zezwolenia",
            "priceNote": "Zezwolenia okresowe (1, 3, 7, 14 dni i do końca roku) tylko przez e-zezwolenia okręgu. Składka PZW nie zastępuje zezwolenia. Sprawdź cennik na stronie przed wyjazdem.",
        },
        "pzw-gorzow": {
            "id": "pzw-gorzow",
            "name": "Okręg PZW w Gorzowie Wielkopolskim",
            "shortName": "PZW Gorzów Wlkp.",
            "website": "https://gorzow.pzw.pl/",
            "permitUrl": "https://pzw.gorzow.pl/zezwolenia/",
            "permitLabel": "Wymagane zezwolenie",
            "priceLabel": "Cennik okręgu",
            "priceNote": "Lubuskie wody okręgu Gorzów (m.in. Gorzów, Strzelce Krajeńskie, Sulęcin, Międzyrzecz, Słubice). Barlinek, Myślibórz, Drawno — pakiet zachodniopomorski.",
        },
        "gr-slawa": {
            "id": "gr-slawa",
            "name": "Gospodarstwo Rybackie Sława",
            "shortName": "GR Sława",
            "website": "https://www.gospodarstworybackie.slawa.pl/",
            "permitUrl": "https://www.gospodarstworybackie.slawa.pl/",
            "permitLabel": "Karnet GR Sława",
            "priceNote": "Karnet gospodarstwa, nie PZW. Cennik 2026: dzień / 3 dni / 7 dni / 14 dni / rok. Tel. 607 607 403. Przelew: 26 1020 4144 0000 6002 0165 5166 (imię, termin, metoda, obwód). Zakaz trollingu.",
        },
    }
    mgr_file = {
        "managers": managers,
        "okragToManager": {"Zielona Góra": "pzw-zielona-gora", "Gorzów": "pzw-gorzow"},
        "hostById": host_by_id,
        "kindKeys": {"gr-slawa": "private"},
        "paperOrder": ["pzw-zielona-gora", "pzw-gorzow", "gr-slawa"],
    }
    stock = {
        "sources": {
            "zg2025": {
                "url": "https://zozgora.pzw.pl/",
                "label": "PZW Zielona Góra — zarybienia 2025",
            }
        },
        "managers": {
            "pzw-zielona-gora": {
                "year": 2025,
                "summary": "Zarybienia 2025: karp, lin, karaś, szczupak, jaź, sandacz, płoć, leszcz, węgorz — według wykazu okręgu.",
                "url": "https://zozgora.pzw.pl/",
                "label": "Zarybienia 2025",
            }
        },
        "waters": zaryb,
    }
    manifest = {
        "id": "lb",
        "name": "województwo lubuskie",
        "shortName": "Lubuskie",
        "teryt": "08",
        "bounds": BOUNDS,
        "center": [CENTER[0], CENTER[1]],
        "zoom": 8,
        "n": len(waters),
        "version": "2026.09",
        "defaultManager": "pzw-zielona-gora",
        "watersDir": "waters",
        "managers": "managers.json",
        "stocking": "stocking.json",
    }
    OUT_WATERS.write_text(json.dumps(waters, ensure_ascii=False))
    OUT_MGR.write_text(json.dumps(mgr_file, ensure_ascii=False, indent=2))
    OUT_STOCK.write_text(json.dumps(stock, ensure_ascii=False, indent=2))
    OUT_MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print("wrote", len(waters), "waters")


if __name__ == "__main__":
    main()
