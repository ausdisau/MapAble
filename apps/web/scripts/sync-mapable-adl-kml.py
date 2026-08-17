#!/usr/bin/env python3
"""Sync MapAble by Australian Disability Ltd KML into Access Map JSON.

Sources (first match wins):
  1. CLI path argument
  2. MAPABLE_ADL_KML_PATH env
  3. data/imports/MapAble by Australian Disability Ltd.kml
  4. data/imports/MapAble.kml
  5. Allowlisted Google My Maps KML URL

Writes public/data/mapable-adl-places.json for Access Map consumption.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {"k": "http://www.opengis.net/kml/2.2"}
SOURCE_NAME = "MapAble by Australian Disability Ltd"
SOURCE_MID = "1sx0iyF2RqJKO8maeZ_Sn_EvWVyybcrOI"
SOURCE_URL = f"https://www.google.com/maps/d/kml?forcekml=1&mid={SOURCE_MID}"
SOURCE_SHARE_URL = (
    f"https://www.google.com/maps/d/edit?mid={SOURCE_MID}&usp=sharing"
)
OUT_PATH = ROOT / "public" / "data" / "mapable-adl-places.json"

LAYER_META = {
    "Services": {
        "category": "health_service",
        "fact": "Disability / community service location",
        "label": "Service",
    },
    "ToiletmapExport_170601_090005.csv": {
        "category": "public_toilet",
        "fact": "Accessible toilet (Toilet Map export)",
        "label": "Accessible toilet",
    },
    "all-abilities-playgrounds.lyr": {
        "category": "park",
        "fact": "All-abilities playground",
        "label": "All-abilities playground",
    },
    "Stairs": {
        "category": "other",
        "fact": "Stairs location — may indicate a barrier",
        "label": "Stairs",
    },
    "Mobility_parking": {
        "category": "other",
        "fact": "Mobility parking bay",
        "label": "Mobility parking",
    },
    "INF_LOC_TOILETACCESSIBILITY_E": {
        "category": "public_toilet",
        "fact": "Accessible toilet location",
        "label": "Accessible toilet",
    },
    # Aggregate district rows without coordinates — not useful as map pins.
    "Active NDIS providers as at 31 December 2024.csv": {"skip": True},
}


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:80] or "place"


def strip_html(html: str) -> str:
    text = re.sub(r"(?is)<script[\s\S]*?</script>", "", html)
    text = re.sub(r"(?is)<style[\s\S]*?</style>", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def my_maps_mid_from_url(value: str) -> str | None:
    match = re.search(r"[?&]mid=([^&]+)", value)
    if match:
        return match.group(1)
    match = re.search(r"/d/(?:u/\d+/)?(?:edit|viewer|kml)/([^/?#]+)", value, re.I)
    return match.group(1) if match else None


def resolve_kml_path() -> Path | None:
    candidates: list[Path] = []
    if len(sys.argv) > 1 and not str(sys.argv[1]).startswith("http"):
        candidates.append(Path(sys.argv[1]))
    env = os.environ.get("MAPABLE_ADL_KML_PATH")
    if env and not env.startswith("http"):
        candidates.append(Path(env))
    candidates.extend(
        [
            ROOT
            / "data"
            / "imports"
            / "MapAble by Australian Disability Ltd.kml",
            ROOT / "data" / "imports" / "MapAble.kml",
        ]
    )
    for path in candidates:
        if path.is_file() and path.stat().st_size > 2_000:
            # Prefer full exports over NetworkLink stubs.
            text = path.read_text(encoding="utf-8", errors="ignore")
            if "<Placemark" in text:
                return path
    for path in candidates:
        if path.is_file():
            return path
    return None


def fetch_source_url() -> str:
    """Prefer CLI/env Google My Maps URL when it matches the allowlisted mid."""
    for candidate in [*(sys.argv[1:] if len(sys.argv) > 1 else []), os.environ.get("MAPABLE_ADL_KML_PATH") or ""]:
        if not candidate.startswith("http"):
            continue
        mid = my_maps_mid_from_url(candidate)
        if mid == SOURCE_MID:
            return SOURCE_URL
    return SOURCE_URL


def load_kml_xml() -> tuple[str, str]:
    path = resolve_kml_path()
    if path is not None:
        xml = path.read_text(encoding="utf-8", errors="ignore")
        if "<Placemark" in xml:
            return xml, str(path)
        # NetworkLink stub — fetch allowlisted target.
        href_match = re.search(
            r"<NetworkLink[^>]*>[\s\S]*?<href[^>]*>([^<]+)</href>",
            xml,
            re.I,
        )
        if href_match:
            href = (
                href_match.group(1)
                .strip()
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
            )
            mid = my_maps_mid_from_url(href)
            if href == SOURCE_URL or mid == SOURCE_MID:
                with urllib.request.urlopen(SOURCE_URL, timeout=60) as res:
                    return res.read().decode("utf-8", errors="ignore"), SOURCE_URL
    fetch_url = fetch_source_url()
    with urllib.request.urlopen(fetch_url, timeout=60) as res:
        return res.read().decode("utf-8", errors="ignore"), fetch_url


def build_places(xml: str) -> tuple[list[dict], dict[str, int]]:
    root = ET.fromstring(xml)
    doc = root.find("k:Document", NS)
    if doc is None:
        doc = root

    places: list[dict] = []
    seen_slugs: set[str] = set()
    seen_keys: set[str] = set()
    skipped_layers: dict[str, int] = {}
    processed_layers: set[str] = set()

    for folder_index, folder in enumerate(doc.findall("./k:Folder", NS)):
        layer = (folder.findtext("k:name", default="", namespaces=NS) or "").strip()
        meta = LAYER_META.get(
            layer,
            {
                "category": "other",
                "fact": f"Imported from {layer or 'MapAble KML'}",
                "label": layer or "Place",
            },
        )
        if meta.get("skip"):
            skipped_layers[layer] = len(folder.findall("./k:Placemark", NS))
            continue
        if layer in processed_layers:
            continue
        processed_layers.add(layer)

        for pm_index, pm in enumerate(folder.findall("./k:Placemark", NS)):
            name = (pm.findtext("k:name", default="", namespaces=NS) or "").strip()
            coords_el = pm.find("./k:Point/k:coordinates", NS)
            if coords_el is None:
                coords_el = pm.find(".//k:Point/k:coordinates", NS)
            if coords_el is None or not (coords_el.text or "").strip():
                continue
            parts = re.split(r"[\s,]+", (coords_el.text or "").strip())
            try:
                lng = float(parts[0])
                lat = float(parts[1])
            except (ValueError, IndexError):
                continue
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
            if not name:
                name = f"{meta.get('label', 'Place')} ({lat:.4f}, {lng:.4f})"
            key = f"{name}|{lat:.6f}|{lng:.6f}|{layer}"
            if key in seen_keys:
                continue
            seen_keys.add(key)
            place_id = (
                "adl-"
                + hashlib.sha1(
                    f"{key}|{folder_index}|{pm_index}".encode()
                ).hexdigest()[:12]
            )
            base = slugify(name)
            slug = base
            n = 2
            while slug in seen_slugs:
                slug = f"{base}-{n}"
                n += 1
            seen_slugs.add(slug)
            desc_raw = pm.findtext("k:description", default="", namespaces=NS) or ""
            desc = strip_html(desc_raw)[:240] if desc_raw else ""
            place = {
                "id": place_id,
                "slug": slug,
                "name": name,
                "layer": layer,
                "category": meta.get("category", "other"),
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "fact": meta.get("fact", "Imported from MapAble KML"),
            }
            if desc:
                place["desc"] = desc
            places.append(place)

    return places, skipped_layers


def main() -> int:
    xml, source = load_kml_xml()
    places, skipped = build_places(xml)
    payload = {
        "source": SOURCE_NAME,
        "sourceUrl": SOURCE_SHARE_URL,
        "kmlUrl": SOURCE_URL,
        "attribution": "MapAble by Australian Disability Ltd (Google My Maps share)",
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "loadedFrom": source,
        "count": len(places),
        "skippedLayers": skipped,
        "layerCounts": dict(Counter(p["layer"] for p in places)),
        "places": places,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(places)} places, from {source})")
    print("Layers:", payload["layerCounts"])
    if skipped:
        print("Skipped:", skipped)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
