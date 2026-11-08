#!/usr/bin/env python3
"""Bounded, OFFLINE, research-only staging of Google Open Buildings V3 CSVs.

Accepts public Open Buildings V3 polygons/points CSV or concatenated gzip CSV,
including the headerless level-6 tiles used by Google's example Colab notebook.
It never fetches remote data, authenticates to Google, or updates MapAble routing.

Google's V3 data license is dual CC BY 4.0 / ODbL 1.0; the operator must choose
one reuse path. The upstream notebook's Apache 2.0 code license is different.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator, TextIO

SOURCE_ID = "google-open-buildings-footprints"
SOURCE_URL = "https://sites.research.google/gr/open-buildings/"
SOURCE_DATA_VERSION = "v3"
SOURCE_INFERENCE_MONTH = "2023-05"
ATTRIBUTION = "Google Research – Open Buildings V3"

# Published country-code coverage for the V3 footprints, not a statement
# about local completeness. Check the current Google metadata before using.
COVERED_COUNTRIES = set("""
ARG ATG BDI BEN BFA BGD BHS BLM BLZ BOL BRA BRB BRN BTN BWA CAF CHL
CIV CMR COD COG COL COM CPV CRI CUB CUW CYM DJI DMA DOM DZA ECU EGY
ERI ETH FLK GAB GHA GIN GMB GNB GNQ GRD GTM GUY HND HTI IDN IND
IOT JAM KEN KHM KNA LAO LBR LCA LKA LSO MAF MDG MDV MEX MOZ
MRT MSR MUS MWI MYS MYT NAM NER NGA NIC NPL PAN PER PHL PRI PRY
RWA SDN SEN SGP SHN SLE SLV SOM STP SUR SWZ SXM SYC TCA TGO THA
TLS TTO TUN TZA UGA URY VCT VEN VGB VIR VNM ZAF ZMB ZWE
""".split())

POINT_COLUMNS = ("latitude", "longitude", "area_in_meters", "confidence", "full_plus_code")
POLYGON_COLUMNS = ("latitude", "longitude", "area_in_meters", "confidence", "geometry", "full_plus_code")
ALLOWED_LICENCES = {"CC-BY-4.0", "ODbL-1.0"}
MAX_CSV_FIELD_BYTES = 2_000_000
DEFAULT_MAX_COMPRESSED_BYTES = 64 * 1024 * 1024
DEFAULT_MAX_ROWS = 100_000
DEFAULT_MAX_OUTPUT_BYTES = 128 * 1024 * 1024


class StagingError(ValueError):
    """Invalid/unapproved input. No partial output should be published."""


def _require_shapely():
    try:
        from shapely import wkt  # type: ignore[import-not-found]
        from shapely.geometry import mapping  # type: ignore[import-not-found]
    except ImportError as exc:
        raise StagingError("Polygon or WKT AOI support requires: pip install shapely") from exc
    return wkt, mapping


def _parse_aoi(raw: str | None):
    if not raw:
        return None
    wkt, _ = _require_shapely()
    try:
        geometry = wkt.loads(raw)
    except Exception as exc:
        raise StagingError("AOI must be valid EPSG:4326 WKT") from exc
    if geometry.geom_type not in {"Polygon", "MultiPolygon"}:
        raise StagingError("AOI WKT must be Polygon or MultiPolygon")
    _validate_geometry(geometry, "AOI")
    return geometry


def _validate_geometry(geometry: Any, label: str):
    if geometry.is_empty or not geometry.is_valid:
        raise StagingError(f"{label} is empty or invalid")
    xmin, ymin, xmax, ymax = geometry.bounds
    if not all(math.isfinite(v) for v in (xmin, ymin, xmax, ymax)):
        raise StagingError(f"{label} has non-finite coordinates")
    if not (-180 <= xmin <= xmax <= 180 and -90 <= ymin <= ymax <= 90):
        raise StagingError(f"{label} coordinates must be EPSG:4326 longitude/latitude")


def _numeric(raw: str, label: str, line: int, low: float, high: float) -> float:
    try:
        value = float(raw)
    except (ValueError, TypeError) as exc:
        raise StagingError(f"Line {line}: invalid {label}") from exc
    if not math.isfinite(value) or not (low <= value <= high):
        raise StagingError(f"Line {line}: {label} outside [{low}, {high}]")
    return value


def _is_in_aoi(lat: float, lon: float, aoi: Any) -> bool:
    if aoi is None:
        return True
    from shapely.geometry import Point  # type: ignore[import-not-found]
    # Consistent with Google's example: filter on supplied building centroid.
    # A footprint may intersect the AOI even if its centroid lies outside.
    return bool(aoi.covers(Point(lon, lat)))


def _rows(handle: TextIO, data_type: str, headerless: bool) -> Iterator[dict[str, str]]:
    csv.field_size_limit(MAX_CSV_FIELD_BYTES)
    reader = csv.reader(handle, strict=True)
    expected = POLYGON_COLUMNS if data_type == "polygons" else POINT_COLUMNS
    if not headerless:
        try:
            header = tuple(next(reader))
        except StopIteration as exc:
            raise StagingError("Empty CSV file") from exc
        header = (header[0].lstrip("\ufeff"),) + header[1:]
        if header != expected:
            raise StagingError(f"Expected CSV header {expected!r}; got {header!r}. "
                               "For raw no-header tiles, pass --headerless")
    for row in reader:
        if not row:
            continue
        if len(row) != len(expected):
            raise StagingError(f"CSV row has {len(row)} columns; expected {len(expected)}")
        yield dict(zip(expected, row, strict=True))


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return "sha256:" + digest.hexdigest()


def _open_csv(path: Path):
    if path.suffix == ".gz":
        return gzip.open(path, "rt", encoding="utf-8", newline="")
    return path.open("rt", encoding="utf-8", newline="")


def stage_open_buildings(
    *, input_path: Path, output_path: Path, data_type: str,
    country: str, licence: str, headerless: bool = False,
    aoi_wkt: str | None = None, min_confidence: float = 0.65,
    max_rows: int = DEFAULT_MAX_ROWS,
    max_input_bytes: int = DEFAULT_MAX_COMPRESSED_BYTES,
    max_output_bytes: int = DEFAULT_MAX_OUTPUT_BYTES,
    acquired_at: str | None = None,
) -> dict[str, Any]:
    if data_type not in {"points", "polygons"}:
        raise StagingError("Data type must be points or polygons")
    if licence not in ALLOWED_LICENCES:
        raise StagingError("Choose exactly one official V3 reuse licence")
    country = country.upper().strip()
    if country not in COVERED_COUNTRIES:
        raise StagingError(f"{country!r} not in published V3 coverage; no data should be assumed")
    if not math.isfinite(min_confidence) or not (0 <= min_confidence <= 1):
        raise StagingError("Confidence filter must be finite and between 0 and 1")
    if max_rows < 1 or max_input_bytes < 1 or max_output_bytes < 1:
        raise StagingError("Input limits must be positive")
    if acquired_at is not None:
        try:
            parsed = datetime.fromisoformat(acquired_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise StagingError("--acquired-at must be ISO 8601 with timezone") from exc
        if parsed.tzinfo is None:
            raise StagingError("--acquired-at must include timezone")
    input_path = input_path.resolve()
    output_path = output_path.resolve()
    manifest_path = Path(str(output_path) + ".manifest.json")
    if input_path == output_path or input_path == manifest_path:
        raise StagingError("Input and output locations must differ")
    if not input_path.is_file():
        raise StagingError("Input file does not exist")
    if input_path.stat().st_size > max_input_bytes:
        raise StagingError("Compressed/input file size limit exceeded; split into bounded AOI tiles")
    if output_path.exists() or manifest_path.exists():
        raise StagingError("Output and manifest must not exist (no overwrites)")
    if not output_path.parent.is_dir():
        raise StagingError("Output directory must exist")
    if output_path.suffix not in {".jsonl", ".geojsonl", ".ndjson"}:
        raise StagingError("Output should use .geojsonl, .jsonl or .ndjson extension")

    aoi = _parse_aoi(aoi_wkt)
    wkt_parser = geometry_mapping = None
    if data_type == "polygons":
        wkt_parser, geometry_mapping = _require_shapely()

    input_hash = _sha256_file(input_path)
    staged_at = datetime.now(timezone.utc).isoformat()
    processed = included = filtered_by_confidence = filtered_by_aoi = duplicates = 0
    seen: set[str] = set()
    output_hash = hashlib.sha256()
    output_bytes = 0
    temp_path: Path | None = None
    manifest_created = False
    lock_path = Path(str(output_path) + ".lock")
    try:
        lock_fd = os.open(lock_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError as exc:
        raise StagingError("Another staging job already holds the output lock") from exc
    except OSError as exc:
        raise StagingError("Cannot create output lock") from exc
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", newline="\n", dir=output_path.parent,
            prefix=".open-buildings-staging-", suffix=".tmp", delete=False,
        ) as staged:
            temp_path = Path(staged.name)
            try:
                with _open_csv(input_path) as data:
                    for record in _rows(data, data_type, headerless):
                        processed += 1
                        if processed > max_rows:
                            raise StagingError("Input row limit exceeded: no partial output published")
                        line = processed + (0 if headerless else 1)
                        lat = _numeric(record["latitude"], "latitude", line, -90, 90)
                        lon = _numeric(record["longitude"], "longitude", line, -180, 180)
                        area = _numeric(record["area_in_meters"], "area_in_meters", line, 0, 1e12)
                        confidence = _numeric(record["confidence"], "confidence", line, 0, 1)
                        if confidence < min_confidence:
                            filtered_by_confidence += 1
                            continue
                        if not _is_in_aoi(lat, lon, aoi):
                            filtered_by_aoi += 1
                            continue

                        if data_type == "polygons":
                            assert wkt_parser is not None and geometry_mapping is not None
                            try:
                                geometry = wkt_parser.loads(record["geometry"])
                            except Exception as exc:
                                raise StagingError(f"Line {line}: malformed WKT footprint") from exc
                            if geometry.geom_type not in {"Polygon", "MultiPolygon"}:
                                raise StagingError(f"Line {line}: not a polygon or multipolygon")
                            _validate_geometry(geometry, f"Line {line} footprint")
                            mapped = geometry_mapping(geometry)
                            # Shapely mapping values use Python tuples; json converts to lists.
                        else:
                            mapped = {"type": "Point", "coordinates": [lon, lat]}

                        # The source has no globally stable building ID: use an exact-row
                        # fingerprint for deduplication within this V3 export only.
                        canonical = json.dumps(record, sort_keys=True, separators=(",", ":"))
                        fingerprint = "sha256:" + hashlib.sha256(canonical.encode()).hexdigest()
                        if fingerprint in seen:
                            duplicates += 1
                            continue
                        seen.add(fingerprint)
                        item = {
                            "type": "Feature", "geometry": mapped,
                            "properties": {
                                "sourceId": SOURCE_ID,
                                "sourceRecordFingerprint": fingerprint,
                                "datasetVersion": SOURCE_DATA_VERSION,
                                "modelInferenceMonth": SOURCE_INFERENCE_MONTH,
                                "physicalObservedAt": None,
                                "dataClass": "GEOGRAPHIC_CONTEXT_RESEARCH_ONLY",
                                "evidenceType": "building_footprint_candidate",
                                "verificationStatus": "AI_INFERRED_UNVERIFIED",
                                "accessibilityVerified": False,
                                "eligibleForRouting": False,
                                "modelDetectionConfidence": confidence,
                                "areaSquareMetres": area,
                                "fullPlusCode": record["full_plus_code"],
                                "centroid": [lon, lat],
                            },
                        }
                        payload = json.dumps(item, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
                        payload_bytes = payload.encode("utf-8")
                        output_bytes += len(payload_bytes)
                        if output_bytes > max_output_bytes:
                            raise StagingError("Output byte limit exceeded: no partial output published")
                        staged.write(payload)
                        output_hash.update(payload_bytes)
                        included += 1
            except (OSError, UnicodeError, csv.Error) as exc:
                raise StagingError(f"Input CSV/gzip invalid: {type(exc).__name__}") from exc

        manifest = {
            "version": 1,
            "status": "STAGED_RESEARCH_ONLY",
            "eligibleForOperationalImport": False,
            "eligibleForRouteGraph": False,
            "sourceId": SOURCE_ID,
            "datasetVersion": SOURCE_DATA_VERSION,
            "datasetInferenceMonth": SOURCE_INFERENCE_MONTH,
            "physicalObservedAt": None,
            "sourceUrl": SOURCE_URL,
            "licenceChosen": licence,
            "attribution": ATTRIBUTION,
            "originalNotebookCodeLicence": "Apache-2.0",
            "countryIso3": country,
            "dataType": data_type,
            "coordinateReferenceSystem": "EPSG:4326",
            "aoiWkt": aoi_wkt,
            "aoiSelection": "building_centroid_covers_AOI" if aoi_wkt else "source_file_region_only",
            "minDetectionConfidenceFilter": min_confidence,
            "confidenceMeaning": "model building-detection score; NOT accessibility evidence",
            "inputFilename": input_path.name,
            "sourceAcquiredAt": acquired_at,
            "stagedAt": staged_at,
            "inputFileSha256": input_hash,
            "outputGeojsonlSha256": "sha256:" + output_hash.hexdigest(),
            "counts": {
                "read": processed, "staged": included,
                "filteredForConfidence": filtered_by_confidence,
                "filteredForAoi": filtered_by_aoi,
                "duplicateExactRows": duplicates,
            },
            "notes": [
                "V3 footprints do not contain accessible entrance or pedestrian-network data.",
                "Physical observation date unknown, including if input was recently downloaded.",
                "Rows are candidates only; official field verification required for access claims.",
                "Exact-row fingerprints are not stable building identifiers across datasets or versions.",
                "No remote fetch, route deployment, database writes, or Google Drive integration occurred.",
            ],
        }
        # Fail closed on partial writes; output/manifest are new files only.
        with manifest_path.open("x", encoding="utf-8") as out:
            manifest_created = True
            json.dump(manifest, out, indent=2, ensure_ascii=False)
            out.write("\n")
        assert temp_path is not None
        os.replace(temp_path, output_path)
        temp_path = None
        return manifest
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
        # Only remove a manifest created by THIS invocation.
        if manifest_created and manifest_path.exists() and not output_path.exists():
            manifest_path.unlink(missing_ok=True)
        os.close(lock_fd)
        lock_path.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Local V3 CSV or CSV.gz")
    parser.add_argument("--output", required=True, type=Path, help="New *.geojsonl path")
    parser.add_argument("--data-type", choices=("points", "polygons"), required=True)
    parser.add_argument("--country", required=True, help="Covered ISO3 country code, e.g. IND or SGP")
    parser.add_argument("--licence", choices=sorted(ALLOWED_LICENCES), required=True)
    parser.add_argument("--headerless", action="store_true", help="Raw level-6 no-header tile CSV")
    parser.add_argument("--aoi-wkt", default=None, help="Optional EPSG:4326 Polygon or MultiPolygon WKT")
    parser.add_argument("--min-confidence", type=float, default=0.65)
    parser.add_argument("--max-rows", type=int, default=DEFAULT_MAX_ROWS)
    parser.add_argument("--max-input-bytes", type=int, default=DEFAULT_MAX_COMPRESSED_BYTES)
    parser.add_argument("--max-output-bytes", type=int, default=DEFAULT_MAX_OUTPUT_BYTES)
    parser.add_argument("--acquired-at", default=None, help="Known original download time (ISO 8601 TZ), not physical observation")
    args = parser.parse_args(argv)
    try:
        result = stage_open_buildings(
            input_path=args.input, output_path=args.output, data_type=args.data_type,
            country=args.country, licence=args.licence, headerless=args.headerless,
            aoi_wkt=args.aoi_wkt, min_confidence=args.min_confidence,
            max_rows=args.max_rows, max_input_bytes=args.max_input_bytes,
            max_output_bytes=args.max_output_bytes, acquired_at=args.acquired_at,
        )
    except StagingError as exc:
        parser.exit(2, f"Staging refused: {exc}\n")
    print(json.dumps({"status": result["status"], "counts": result["counts"],
                      "sourceId": result["sourceId"], "eligibleForRouting": False}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())