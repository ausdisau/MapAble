import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Guards against the migration ledger (migrations/meta/_journal.json)
 * drifting out of sync with the on-disk SQL files — which previously
 * happened silently (missing journal entries + a duplicated numeric
 * prefix) when migrations were hand-added.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../migrations");
const journalPath = path.join(migrationsDir, "meta", "_journal.json");

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

const journal: { entries: JournalEntry[] } = JSON.parse(
  fs.readFileSync(journalPath, "utf-8"),
);
const entries = journal.entries;

const sqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

test("every SQL file has exactly one journal entry and vice versa (1:1, no orphans)", () => {
  const fileTags = sqlFiles.map((f) => f.replace(/\.sql$/, ""));
  const journalTags = entries.map((e) => e.tag);

  const fileTagSet = new Set(fileTags);
  const journalTagSet = new Set(journalTags);

  assert.equal(
    journalTags.length,
    journalTagSet.size,
    `Duplicate tags in _journal.json: ${journalTags.filter((t, i) => journalTags.indexOf(t) !== i).join(", ")}`,
  );

  const missingFromJournal = fileTags.filter((t) => !journalTagSet.has(t));
  assert.deepEqual(
    missingFromJournal,
    [],
    `SQL files with no journal entry: ${missingFromJournal.join(", ")}`,
  );

  const missingFiles = journalTags.filter((t) => !fileTagSet.has(t));
  assert.deepEqual(
    missingFiles,
    [],
    `Journal entries with no SQL file: ${missingFiles.join(", ")}`,
  );
});

test("journal idx values are contiguous starting at 0", () => {
  const idxs = entries.map((e) => e.idx);
  assert.deepEqual(
    idxs,
    idxs.map((_, i) => i),
    `Expected idx values 0..${entries.length - 1}, got: ${idxs.join(", ")}`,
  );
});

test('journal "when" timestamps are strictly increasing', () => {
  for (let i = 1; i < entries.length; i++) {
    assert.ok(
      entries[i].when > entries[i - 1].when,
      `Entry ${entries[i].tag} (when=${entries[i].when}) is not after ${entries[i - 1].tag} (when=${entries[i - 1].when})`,
    );
  }
});

test("no two SQL files share the same numeric prefix", () => {
  const prefixes = new Map<string, string[]>();
  for (const f of sqlFiles) {
    const m = f.match(/^(\d+)_/);
    assert.ok(m, `Migration file without numeric prefix: ${f}`);
    const list = prefixes.get(m![1]) ?? [];
    list.push(f);
    prefixes.set(m![1], list);
  }
  const dupes = [...prefixes.values()].filter((files) => files.length > 1);
  assert.deepEqual(
    dupes,
    [],
    `SQL files sharing a numeric prefix: ${dupes.map((d) => d.join(" & ")).join("; ")}`,
  );
});
