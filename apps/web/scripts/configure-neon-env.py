#!/usr/bin/env python3
"""Write Neon DATABASE_URL and DIRECT_URL into .env from a pooled connection string."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


def to_direct_url(pooled: str) -> str:
    parsed = urlparse(pooled)
    host = parsed.hostname or ""
    if "-pooler" not in host:
        return pooled
    direct_host = host.replace("-pooler", "", 1)
    netloc = parsed.netloc.replace(host, direct_host, 1)
    query = parse_qs(parsed.query, keep_blank_values=True)
    # channel_binding can break some Node/pg + Prisma setups
    query.pop("channel_binding", None)
    if "sslmode" not in query:
        query["sslmode"] = ["require"]
    new_query = urlencode({k: v[0] for k, v in query.items()})
    return urlunparse(
        (
            parsed.scheme,
            netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        )
    )


def normalize_pooled(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    query.pop("channel_binding", None)
    if "sslmode" not in query:
        query["sslmode"] = ["require"]
    new_query = urlencode({k: v[0] for k, v in query.items()})
    return urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        )
    )


def update_env(database_url: str, direct_url: str) -> None:
    if not ENV_PATH.exists():
        raise SystemExit(f"Missing {ENV_PATH}. Copy from .env.example first.")

    text = ENV_PATH.read_text()
    text = re.sub(
        r'^DATABASE_URL=.*$',
        f'DATABASE_URL="{database_url}"',
        text,
        count=1,
        flags=re.M,
    )
    text = re.sub(
        r'^DIRECT_URL=.*$',
        f'DIRECT_URL="{direct_url}"',
        text,
        count=1,
        flags=re.M,
    )
    ENV_PATH.write_text(text)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python scripts/configure-neon-env.py "
            "'postgresql://user:pass@ep-xxx-pooler....neon.tech/neondb?sslmode=require'"
        )
    pooled = normalize_pooled(sys.argv[1].strip().strip('"'))
    direct = to_direct_url(pooled)
    update_env(pooled, direct)
    print(f"Updated {ENV_PATH}")
    print("  DATABASE_URL → pooled host")
    print("  DIRECT_URL   → direct host (for prisma db push / migrate)")


if __name__ == "__main__":
    main()
