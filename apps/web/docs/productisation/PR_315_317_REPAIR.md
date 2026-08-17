# Repair notes — PRs #315 / #316 / #317

## Why repair was needed

| PR | Original issue | Resolution on main |
| --- | --- | --- |
| #315 Companion foundation | CI type-check failed (`shareMode`, `NODE_ENV` test); stacked on closed bases | Product content landed via **#327**; security/type fixes via **#313** |
| #316 Provider Ops | Same CI/Vercel failures on stack | Product content landed via **#327** |
| #317 Starting Work pilot | Same CI/Vercel failures on stack | Product content landed via **#327** / **#330** (DB projection) |

These draft PRs were closed on 2026-07-17 without merge. Content was consolidated onto `main` rather than merged through the broken stack.

## Repair actions (this pass)

1. Retarget heads onto current `main`.
2. Keep slice-specific hardening (flag maturity, a11y hints, attention ordering honesty, pilot claim honesty).
3. Reopen as drafts based on `main` (not the obsolete stack bases).
4. Re-run companion / provider-ops / pilot vitest suites.

## Non-goals

- Do not reintroduce parallel Care/Transport/Billing writers.
- Do not enable production App Store / public claims.
- Do not claim Starting Work is a live booking engine.
