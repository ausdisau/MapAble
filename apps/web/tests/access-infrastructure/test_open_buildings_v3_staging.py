"""Synthetic-only staging tests; never require network or actual Google exports."""

import gzip
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE_FILE = Path(__file__).resolve().parents[2] / "scripts" / "access" / "stage_open_buildings_v3.py"
spec = importlib.util.spec_from_file_location("stage_open_buildings_v3", MODULE_FILE)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class OpenBuildingsStageTest(unittest.TestCase):
    def setUp(self):
        self.work = tempfile.TemporaryDirectory()
        self.addCleanup(self.work.cleanup)
        self.dir = Path(self.work.name)
        self.input = self.dir / "sample.csv.gz"
        self.output = self.dir / "staged.geojsonl"
        self.points_header = "latitude,longitude,area_in_meters,confidence,full_plus_code\n"
        self.point1 = "1.3039,103.8318,101.5,0.90,6PH57R3J+H5\n"
        self.point2 = "1.3040,103.8319,52.0,0.70,6PH57R3J+H6\n"

    def write_gzip(self, content):
        with gzip.open(self.input, "wt", encoding="utf-8", newline="") as f:
            f.write(content)

    def stage(self, **kwargs):
        return module.stage_open_buildings(
            input_path=self.input,
            output_path=self.output,
            data_type=kwargs.pop("data_type", "points"),
            country=kwargs.pop("country", "SGP"),
            licence=kwargs.pop("licence", "CC-BY-4.0"), **kwargs)

    def features(self):
        return [json.loads(l) for l in self.output.read_text().splitlines()]

    def manifest(self):
        return json.loads(Path(str(self.output) + ".manifest.json").read_text())

    def test_points_are_geographic_context_never_access_approved(self):
        self.write_gzip(self.points_header + self.point1)
        result = self.stage()
        feature = self.features()[0]
        self.assertEqual(feature["type"], "Feature")
        self.assertEqual(feature["geometry"], {"type":"Point", "coordinates":[103.8318,1.3039]})
        self.assertFalse(feature["properties"]["accessibilityVerified"])
        self.assertFalse(feature["properties"]["eligibleForRouting"])
        self.assertEqual(feature["properties"]["verificationStatus"], "AI_INFERRED_UNVERIFIED")
        self.assertIsNone(feature["properties"]["physicalObservedAt"])
        self.assertEqual(result["counts"]["staged"], 1)
        self.assertFalse(self.manifest()["eligibleForOperationalImport"])
        self.assertEqual(self.manifest()["licenceChosen"], "CC-BY-4.0")
        self.assertEqual(self.manifest()["datasetInferenceMonth"], "2023-05")

    def test_both_official_licence_choices_supported_separately(self):
        self.write_gzip(self.points_header + self.point1)
        self.assertEqual(self.stage(licence="ODbL-1.0")["licenceChosen"], "ODbL-1.0")

    def test_blocks_unknown_licence(self):
        self.write_gzip(self.points_header + self.point1)
        with self.assertRaisesRegex(module.StagingError, "licence"):
            self.stage(licence="Apache-2.0")
        self.assertFalse(self.output.exists())

    def test_blocks_unlisted_coverage_countries(self):
        self.write_gzip(self.points_header + self.point1)
        for country in ("AUS", "CHN", "PNG", "ZZZ"):
            with self.subTest(country=country), self.assertRaises(module.StagingError):
                self.stage(country=country)
        self.assertFalse(self.output.exists())

    def test_accepts_india_country_metadata(self):
        self.write_gzip(self.points_header + self.point1)
        self.assertEqual(self.stage(country="IND")["countryIso3"], "IND")

    def test_headerless_tiles(self):
        self.write_gzip(self.point1)
        self.assertEqual(self.stage(headerless=True)["counts"]["staged"], 1)

    def test_headerless_not_implicitly_guessed(self):
        self.write_gzip(self.point1)
        with self.assertRaisesRegex(module.StagingError, "CSV header"):
            self.stage()
        self.assertFalse(self.output.exists())

    def test_rejects_wrong_header_schema(self):
        self.write_gzip("foo,longitude,area_in_meters,confidence,full_plus_code\n" + self.point1)
        with self.assertRaises(module.StagingError):
            self.stage()

    def test_filters_minimum_detection_score(self):
        self.write_gzip(self.points_header + self.point1 + self.point2)
        result = self.stage(min_confidence=0.85)
        self.assertEqual(result["counts"]["staged"], 1)
        self.assertEqual(result["counts"]["filteredForConfidence"], 1)

    def test_deduplication_preserves_one_source_record(self):
        self.write_gzip(self.points_header + self.point1 + self.point1)
        result = self.stage()
        self.assertEqual(result["counts"]["staged"], 1)
        self.assertEqual(result["counts"]["duplicateExactRows"], 1)

    def test_rejects_wrong_column_count(self):
        self.write_gzip(self.points_header + "1.0,103,22\n")
        with self.assertRaisesRegex(module.StagingError, "columns"):
            self.stage()
        self.assertFalse(self.output.exists())
        self.assertFalse(Path(str(self.output) + ".manifest.json").exists())

    def test_rejects_nan_confidence(self):
        self.write_gzip(self.points_header + "1.3039,103.8318,101.5,nan,6PH57R3J+H5\n")
        with self.assertRaisesRegex(module.StagingError, "confidence"):
            self.stage()
        self.assertFalse(self.output.exists())

    def test_rejects_bad_coordinates(self):
        self.write_gzip(self.points_header + "91.0,103.8318,101.5,0.90,6PH57R3J+H5\n")
        with self.assertRaisesRegex(module.StagingError, "latitude"):
            self.stage()

    def test_rejects_bad_area(self):
        self.write_gzip(self.points_header + "1.3039,103.8318,-5,0.90,6PH57R3J+H5\n")
        with self.assertRaisesRegex(module.StagingError, "area"):
            self.stage()

    def test_wkt_aoi_filters_centroids(self):
        self.write_gzip(self.points_header + self.point1 + self.point2)
        aoi = "POLYGON((103.8317 1.3038,103.83185 1.3038,103.83185 1.3041,103.8317 1.3041,103.8317 1.3038))"
        result = self.stage(aoi_wkt=aoi)
        self.assertEqual(result["counts"]["staged"], 1)
        self.assertEqual(result["counts"]["filteredForAoi"], 1)

    def test_wkt_aoi_accepts_boundary(self):
        self.write_gzip(self.points_header + "1,103,10,0.90,x\n")
        aoi = "POLYGON((103 1,103.01 1,103.01 1.01,103 1.01,103 1))"
        self.assertEqual(self.stage(aoi_wkt=aoi)["counts"]["staged"], 1)

    def test_rejects_invalid_aoi(self):
        self.write_gzip(self.points_header + self.point1)
        with self.assertRaises(module.StagingError):
            self.stage(aoi_wkt="POINT (103 1)")

    def test_polygon_uses_wkt_footprint_not_inferred_entrance(self):
        poly = 'POLYGON ((103.8317 1.3038, 103.8319 1.3038, 103.8319 1.304, 103.8317 1.304, 103.8317 1.3038))'
        self.write_gzip("latitude,longitude,area_in_meters,confidence,geometry,full_plus_code\n" +
                        f'1.3039,103.8318,101.5,0.91,"{poly}",6PH57R3J+H5\n')
        self.stage(data_type="polygons")
        f = self.features()[0]
        self.assertEqual(f["geometry"]["type"], "Polygon")
        self.assertEqual(f["properties"]["evidenceType"], "building_footprint_candidate")
        self.assertFalse(f["properties"]["accessibilityVerified"])

    def test_rejects_invalid_polygon_shape(self):
        self.write_gzip("latitude,longitude,area_in_meters,confidence,geometry,full_plus_code\n" +
                        '1.3039,103.8318,101.5,0.91,"POLYGON ((0 0, 1 1, 1 0, 0 1, 0 0))",x\n')
        with self.assertRaisesRegex(module.StagingError, "invalid"):
            self.stage(data_type="polygons")
        self.assertFalse(self.output.exists())

    def test_rejects_non_polygon_shape(self):
        self.write_gzip("latitude,longitude,area_in_meters,confidence,geometry,full_plus_code\n" +
                        '1.3039,103.8318,101.5,0.91,"POINT (103.8318 1.3039)",x\n')
        with self.assertRaisesRegex(module.StagingError, "not a polygon"):
            self.stage(data_type="polygons")

    def test_row_limit_has_no_partial_output(self):
        self.write_gzip(self.points_header + self.point1 + self.point2)
        with self.assertRaisesRegex(module.StagingError, "row limit"):
            self.stage(max_rows=1)
        self.assertFalse(self.output.exists())
        self.assertFalse(Path(str(self.output) + ".manifest.json").exists())

    def test_size_limit_rejects_before_reading(self):
        self.write_gzip(self.points_header + self.point1)
        with self.assertRaisesRegex(module.StagingError, "size limit"):
            self.stage(max_input_bytes=3)
        self.assertFalse(self.output.exists())

    def test_output_byte_limit_aborts_without_partial_output(self):
        self.write_gzip(self.points_header + self.point1)
        with self.assertRaisesRegex(module.StagingError, "Output byte limit"):
            self.stage(max_output_bytes=10)
        self.assertFalse(self.output.exists())
        self.assertFalse(Path(str(self.output) + ".manifest.json").exists())

    def test_existing_output_must_not_be_overwritten(self):
        self.write_gzip(self.points_header + self.point1)
        self.output.write_text("EXISTING DATA\n")
        with self.assertRaisesRegex(module.StagingError, "no overwrites"):
            self.stage()
        self.assertEqual(self.output.read_text(), "EXISTING DATA\n")

    def test_bad_acquired_at_blocked_and_timestamp_kept_distinct(self):
        self.write_gzip(self.points_header + self.point1)
        with self.assertRaisesRegex(module.StagingError, "timezone"):
            self.stage(acquired_at="2026-11-01T05:00:00")
        self.assertEqual(self.stage(acquired_at="2026-11-01T05:00:00Z")["sourceAcquiredAt"], "2026-11-01T05:00:00Z")
        self.assertIsNone(self.features()[0]["properties"]["physicalObservedAt"])

    def test_gzip_concatenation_read_compatible_with_notebook(self):
        with self.input.open("wb") as out:
            out.write(gzip.compress((self.points_header+self.point1).encode()))
            out.write(gzip.compress(self.point2.encode()))
        self.assertEqual(self.stage()["counts"]["staged"], 2)

    def test_concurrent_worker_lock_is_refused_without_mutation(self):
        self.write_gzip(self.points_header + self.point1)
        lock = Path(str(self.output) + ".lock")
        lock.write_text("other worker owns lock")
        with self.assertRaisesRegex(module.StagingError, "output lock"):
            self.stage()
        self.assertFalse(self.output.exists())
        self.assertEqual(lock.read_text(), "other worker owns lock")

    def test_success_releases_lock(self):
        self.write_gzip(self.points_header + self.point1)
        self.stage()
        self.assertFalse(Path(str(self.output) + ".lock").exists())

    def test_qgis_cached_headerless_polygon_tile_respects_aoi_and_remains_research_only(self):
        # QGIS Open Buildings Downloader 0.1.0 caches Google's original
        # level-6 headerless tiles, not a clipped GeoPackage or GeoJSON.
        inside = "POLYGON ((103.8317 1.3038, 103.8319 1.3038, 103.8319 1.3040, 103.8317 1.3040, 103.8317 1.3038))"
        outside = "POLYGON ((103.8319 1.3040, 103.8321 1.3040, 103.8321 1.3042, 103.8319 1.3042, 103.8319 1.3040))"
        self.write_gzip(
            f'1.3039,103.8318,101.5,0.91,"{inside}",6PH57R3J+H5\n'
            f'1.3041,103.8320,52.0,0.71,"{outside}",6PH57R3J+H6\n'
        )
        aoi = "POLYGON ((103.8316 1.3037,103.83185 1.3037,103.83185 1.30395,103.8316 1.30395,103.8316 1.3037))"
        result = self.stage(data_type="polygons", headerless=True, aoi_wkt=aoi)
        self.assertEqual(result["counts"]["read"], 2)
        self.assertEqual(result["counts"]["staged"], 1)
        self.assertEqual(result["counts"]["filteredForAoi"], 1)
        self.assertEqual(self.features()[0]["geometry"]["type"], "Polygon")
        self.assertFalse(self.features()[0]["properties"]["accessibilityVerified"])
        self.assertFalse(self.features()[0]["properties"]["eligibleForRouting"])
        self.assertIsNone(self.features()[0]["properties"]["physicalObservedAt"])

    def test_qgis_both_mode_polygon_cache_must_not_be_staged_as_points_csv(self):
        # GEOMETRY=2 reuses polygon tiles for both output layers. The file
        # contains six columns and must not be silently parsed as a point tile.
        poly = "POLYGON ((103.8317 1.3038,103.8319 1.3038,103.8319 1.3040,103.8317 1.3040,103.8317 1.3038))"
        self.write_gzip(f'1.3039,103.8318,101.5,0.91,"{poly}",6PH57R3J+H5\n')
        with self.assertRaisesRegex(module.StagingError, "columns"):
            self.stage(data_type="points", headerless=True)
        self.assertFalse(self.output.exists())
        self.assertFalse(Path(str(self.output) + ".manifest.json").exists())

    def test_invalid_gzip_creates_no_files(self):
        self.input.write_bytes(b"not a gzip")
        with self.assertRaises(module.StagingError):
            self.stage()
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()