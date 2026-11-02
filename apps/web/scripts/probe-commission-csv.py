#!/usr/bin/env python3
"""Read-only quality and schema profile of an ACTUAL Commission CSV download.

Does not assign registry status, import data, or publish provider rows.
Only outputs source digest, headers, counts, and bounded status-field vocabulary.
Use on authorised public CSV download with provenance recorded by CI.
"""
from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path
import sys

MAX_BYTES = 64 * 1024 * 1024
MAX_ROWS = 250_000
MAX_FIELD = 100_000


def profile_csv(path: Path, source_url: str) -> dict:
    size = path.stat().st_size
    if size <= 0 or size > MAX_BYTES:
        raise ValueError(f"CSV size not accepted: {size} bytes")
    digest = hashlib.sha256()
    with path.open("rb") as raw:
        for block in iter(lambda: raw.read(1024 * 1024), b""):
            digest.update(block)
    csv.field_size_limit(MAX_FIELD)
    with path.open("r", encoding="utf-8-sig", errors="strict", newline="") as stream:
        reader = csv.reader(stream, strict=True)
        headers = next(reader, None)
        if headers is None or len(headers) < 3:
            raise ValueError("CSV missing a sufficiently wide header")
        if any(not header.strip() for header in headers):
            raise ValueError("Blank CSV header")
        if len({h.strip().casefold() for h in headers}) != len(headers):
            raise ValueError("Duplicate or case-colliding headers")
        if "<html" in "".join(headers).lower():
            raise ValueError("An HTML response was returned, not a CSV")
        # Heuristics for diagnostic profiling only, NEVER production field mapping.
        status_indexes = [
            i for i, name in enumerate(headers)
            if "registration" in name.lower() and "status" in name.lower()
        ]
        if not status_indexes:
            status_indexes = [i for i, name in enumerate(headers)
                              if name.strip().casefold() == "status"]
        vocab = {headers[i]: collections.Counter() for i in status_indexes}
        count = 0
        for physical_index, record in enumerate(reader, start=2):
            if len(record) != len(headers):
                raise ValueError(f"Wrong field count at CSV record {physical_index}")
            count += 1
            if count > MAX_ROWS:
                raise ValueError("Row limit exceeded; requires steward review")
            for idx in status_indexes:
                vocab[headers[idx]][record[idx].strip()] += 1
        if not count:
            raise ValueError("CSV has no provider records")
        return {
            "source_url": source_url,
            "bytes": size,
            "sha256": digest.hexdigest(),
            "record_count": count,
            "column_count": len(headers),
            "headers": headers,
            "candidate_registration_status_columns": {
                key: {"distinct_count": len(values),
                      "values": dict(values.most_common(25))}
                for key, values in vocab.items()
            },
            "verified_live_registration_statuses": False,
            "approved_for_import": False,
            "notes": [
                "This is a structural profile of the Commission CSV, not an import.",
                "Column mapping, row grain, licensing and status semantics require human review.",
                "No personal worker screening or access evidence is contained in this report."
            ]
        }


def main() -> int:
    cli = argparse.ArgumentParser()
    cli.add_argument("--file", required=True, type=Path)
    cli.add_argument("--report", required=True, type=Path)
    cli.add_argument("--source-url", required=True)
    args = cli.parse_args()
    expected = "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider/download-csv"
    if args.source_url != expected:
        print("Source URL does not match allowlisted Commission endpoint", file=sys.stderr)
        return 2
    try:
        result = profile_csv(args.file, args.source_url)
    except (ValueError, UnicodeError, csv.Error, OSError) as e:
        print(f"Commission CSV QA failed: {e}", file=sys.stderr)
        return 1
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
