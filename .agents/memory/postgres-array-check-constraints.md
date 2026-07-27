---
name: Postgres array CHECK constraint pitfall
description: array_length on empty arrays returns NULL, silently passing CHECK constraints; use cardinality.
---
When writing a CHECK constraint that requires a non-empty array column (e.g.
map_layers.domains), do NOT use `array_length(col, 1) >= 1`.

**Why:** `array_length(ARRAY[]::text[], 1)` returns NULL (not 0). `NULL >= 1` is
NULL, and a CHECK constraint only fails when it evaluates to FALSE — NULL passes.
So empty arrays slip through an array_length-based check.

**How to apply:** Use `cardinality(col) >= 1` (returns 0 for empty arrays) for the
non-empty test. For membership/allowed-set, `col <@ ARRAY[...allowed...]::text[]`
works (an empty array is contained by anything, so pair it with cardinality).
This is mirrored in the Drizzle table def (check()) and migration 0010.
