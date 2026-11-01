# Architecture — Google Open Buildings V3 bounded research staging

**Claim state:** Implemented and locally tested as a standalone **offline research adapter**; target: `ausdisau/MapAble/apps/web`. It is NOT a live MapAble integration, a licensed production source approval, a pedestrian graph or a wheelchair accessibility assessment.

## Decision and current implementation evidence

MapAble can use the Google Open Buildings V3 dataset as a **building-footprint research layer** where covered, but it must not use inferred buildings to verify entrances, step-free access or routes. The uploaded Google Research notebook is a Colab/Python region downloader; its default is Ghana, and it supports polygon/point exports, a custom WKT AOI in EPSG:4326, and an optional authenticated Google Drive upload.

Repository context reviewed on 1 November 2026: the **canonical** `ausdisau/MapAble` monorepo contains `apps/web` (Next.js/Prisma) and `apps/mobile` (Expo); the standalone staging files proposed here reside under `apps/web`. Canonical web has Access Graph observation/freshness code, but the newer external source registry proposals are in the separate **legacy** `ausdisau/mapableau-new` draft PR #646. Draft PR #647 describes the broader Live Access Fabric in that legacy repository. **Those drafts have not been merged or ported to canonical**, and this adapter does not activate or require them.

## External research and source evidence

- Google Research: https://sites.research.google/gr/open-buildings/ . The official V3 source is an inferred building footprint/centroid dataset, not accessibility or building-use data.
- Google V3 Earth Engine catalogue: https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons . Model inference was run in May 2023, not the date the original imagery was captured.
- Original notebook: https://github.com/google-research/google-research/blob/master/building_detection/open_buildings_download_region_polygons.ipynb . Its code carries an Apache-2.0 notice. **Dataset licence is different:** Google Research offers the V3 building data under a choice of CC BY 4.0 or ODbL 1.0. Recording a selected licence does not resolve MapAble's derivative-database/share-alike obligations for a combined dataset; require legal/data-steward review.
- Official V3 downloadable CSVs are organised at **S2 level 4 with headers**; the supplied Colab notebook additionally uses **S2 level 6 headerless tiles** internally and merges them into one CSV with headers. The local adapter supports both structures. Do not confuse one format with the other.
- Published V3 coverage includes **India and Singapore**. **Australia, Papua New Guinea and China are not listed**. The local converter rejects these three country codes instead of inventing data. V3 omits some sensitive areas and should not be used to infer the absence of buildings, accessibility, or care infrastructure.
- V3 contains centroids, area, a model **building-detection** confidence score, WKT polygon geometry (polygons mode), and Plus Code. The confidence score is not a rating of disability accessibility, not a probability an entrance is accessible and is not field verification.

## Objective and boundaries

Create a deterministic local staging process that accepts **only a pre-downloaded, approved, small V3 CSV/CSV.gz file** and outputs GeoJSON Lines of research candidates plus a machine-readable manifest. The downloader's network, Google Earth Engine, Google Drive authentication, filesystem cleanup and unbounded tile-parallelism are **not** carried into MapAble. No credentials, HTTP requests, automated scheduled jobs, database operations, public API or production routes occur in this code.

### Components

| Component | Role | Assured limitation |
|---|---|---|
| `scripts/access/stage_open_buildings_v3.py` | Stream bounded local CSV/CSV.gz; validate schema, coordinates, geometry, scores; write research candidates and hashes | No remote download or production database writes |
| `.geojsonl` output | GeoJSON Feature per newline, with `eligibleForRouting: false`, `accessibilityVerified: false` | Not a FeatureCollection; adapt only in approved GIS staging |
| `.geojsonl.manifest.json` | Data version, inference month, selected licence, original source, input/output SHA256, separate acquisition/staging timestamps and counts | `physicalObservedAt` is explicitly null |
| `tests/access-infrastructure/test_open_buildings_v3_staging.py` | Pure synthetic test coverage | Does not prove full-repo CI, production schema or source quality |

## Example commands

From the canonical repository root, first run `cd apps/web`. Start from a **manually approved** V3 CSV file downloaded using Google Research's own notebook, Earth Engine or official exports. For a standard **headered** polygon CSV export:

```bash
python -m pip install 'shapely>=2,<3'
python scripts/access/stage_open_buildings_v3.py \
  --input /path/to/approved-open-buildings-v3-india-polygons.csv.gz \
  --output /path/to/research-india.geojsonl \
  --country IND \
  --data-type polygons \
  --licence CC-BY-4.0 \
  --max-rows 100000 \
  --max-input-bytes 67108864
```

For **headerless** level-6 tiles, add `--headerless`. For point CSVs, change to `--data-type points` (no Shapely needed unless using WKT AOI). You may filter to an area with `--aoi-wkt 'POLYGON ((...))'` in EPSG:4326 longitude-latitude order. The filter follows the *centroid* and does not clip footprint polygons or independently verify whether a centroid lies in the declared country.

Use `--acquired-at 2026-11-01T00:00:00Z` only when the actual source acquisition timestamp is known. That timestamp does not replace `physicalObservedAt`. A file may describe imagery much older than 2023. The local script refuses to overwrite existing output, exceed input/row/output bounds, accept unapproved licences, or publish partial output on failure.

### Running tests

```bash
python -m unittest discover -s tests/access-infrastructure -p 'test_open_buildings_v3_staging.py' -v
python -m py_compile scripts/access/stage_open_buildings_v3.py
```

**Local check evidence:** 29 synthetic tests passed on a Python 3 environment with Shapely available; full `pnpm` CI and actual live V3 downloads were not run. Run them independently after the branch is checked out. The importer needs no Google Drive or Earth Engine credentials.

## Evidence, data and licence model

Each output feature has:

- A geometry representing a **building centroid** or published **building footprint** only;
- `sourceId = google-open-buildings-footprints` for future mapping into MapAble's existing source register;
- A SHA256 row fingerprint for **exact-row deduplication**, not a globally stable building identifier;
- The Google model detection confidence stored as `modelDetectionConfidence`;
- `verificationStatus: AI_INFERRED_UNVERIFIED`, `eligibleForRouting: false` and `accessibilityVerified: false`;
- `modelInferenceMonth = 2023-05` and `physicalObservedAt = null`;
- Geographic-context-only usage, deliberately incompatible with route/safety evidence promotion.

Do not cross-populate this content into `AccessObservationRecord` as `verified` or into `AccessPathSegment`, and do not silently merge Google-derived footprints with OpenStreetMap-derived records. Downstream joins require independently reviewed geometry matching, licences, provenance and false-positive/false-negative handling. Human GIS volunteers can confirm whether an inferred building exists and whether the outline is accurate; they must **separately measure** entrances, steps, clear widths, ramps and facilities to make disability-accessibility observations.

## Security, privacy, accessibility and safety

- Only trusted local paths; no arbitrary URL fetching, subprocess invocation, Google authentication or external model calls.
- Input size, row count, output size, field width and selected-country coverage are bounded. Invalid coordinates, invalid geometries and corrupt input reject the entire staging attempt. Output locks and atomic temporary files prevent concurrent writers and publishing partial successful results.
- Record the selected data licence and source attribution. Keep any derivative products and OSM contributions inside a separately reviewed licensing and human-validation pathway.
- No participant data, travel histories or precise user locations are accepted by this process. Avoid exposing sensitive facilities or publishing humanitarian mapping outputs without checking local risk and applicable terms.
- Future participant-facing maps must meet WCAG 2.2 AA, provide keyboard and screen-reader routes through a list-first interface, and include AAC/switch-compatible field reporting and human correction.
- Do not treat an AI footprint as proof of an emergency route or a building entrance. Uncertainty and age are visible, and unknown is not equivalent to inaccessible.

## Risks and mitigations

| Risk | Consequence | Containment |
|---|---|---|
| Using Google V3 for Australian paths | False geographic coverage and ungrounded route claims | Country allowlist; research-only output |
| Equating model confidence with wheelchair suitability | Safety and rights harm | Typed `AI_INFERRED_UNVERIFIED`, hard `eligibleForRouting: false` |
| Old aerial/satellite imagery masquerading as fresh | False update alerts and outdated facilities | Physical observation unknown; version and acquisition dates separate |
| Huge or corrupt tile files | Resource exhaustion or partial datasets | Streaming parser, finite byte/row limits and abort-on-error |
| Mixing ODbL/CC BY obligations without review | Licence and re-publication problems | Explicit licence selection, source records, steward/legal approval |
| Sensitive humanitarian location disclosure | Protection, stigma or security risks | Separate area-level publication and safeguarding approval |

## Next actions and release sequence

1. **Source/data steward:** select an eligible country (India or Singapore as examples), exact licensed resource, small bounded AOI and one licence pathway. Verify scope and source metadata.
2. **GIS engineering:** run the offline adapter with a genuine sample; compare counts, polygons and CRS in QGIS; verify Google V3 schema and WKT assumptions; record its checksums.
3. **Evidence reviewer:** inspect samples against independent field information and the official data quality warnings; use community workflows only with consent and review.
4. **Architecture:** integrate staged candidate outputs with the Live Access Fabric import/reconciliation service **only after** the separate legacy PRs #645, #646 and #647 have been assessed for canonical porting and the real ingestion pipeline passes licence, security, accessibility, CI, rollback and human publication gates.
5. **Deployment decision:** no automated source refresh or participant-facing route update until live source contract, monitoring and human release ownership are explicitly approved.

**Stop conditions:** unknown licence, unclear humanitarian publication risks, invalid source-country coverage, malformed geometry, stale/contradictory observations, no reviewer, failures of security or accessibility checks, or missing consent boundaries. Revert/disable the staging worker without touching the participant-facing routing graph.