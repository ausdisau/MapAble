#!/usr/bin/env npx tsx
/**
 * Build SFT JSONL for a service-category slug classifier (phase 3).
 * Output: data/category-classifier-sft.jsonl (or --out path)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { HERO_SUGGESTED_SEARCHES_FALLBACK } from "../lib/provider/finder/filters";

type SftRow = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

const CATEGORIES: Array<{ slug: string; name: string; queries: string[] }> = [
  {
    slug: "personal-care",
    name: "Personal care",
    queries: [
      "support worker for daily personal care",
      "help with showering and dressing",
      "personal care near me",
      "NDIS personal care support",
    ],
  },
  {
    slug: "accessible-transport",
    name: "Accessible transport",
    queries: [
      "wheelchair accessible transport tomorrow",
      "disability taxi near Parramatta",
      "accessible ride to appointment",
      "wheelchair van transport",
    ],
  },
  {
    slug: "occupational-therapy",
    name: "Occupational therapy",
    queries: [
      "OT assessment with NDIS registration",
      "occupational therapist home visit",
      "OT functional assessment",
      "need occupational therapy in Sydney",
    ],
  },
  {
    slug: "physiotherapy",
    name: "Physiotherapy",
    queries: [
      "physio for mobility NDIS",
      "physiotherapy near Newcastle",
      "physical therapy sessions",
      "registered physiotherapist",
    ],
  },
  {
    slug: "support-coordination",
    name: "Support coordination",
    queries: [
      "support coordinator to review my plan",
      "SC level 2 coordination",
      "help navigating NDIS providers",
      "support coordination services",
    ],
  },
];

function assistantPayload(slug: string): string {
  return JSON.stringify({ slug });
}

function buildRows(): SftRow[] {
  const rows: SftRow[] = [];

  for (const cat of CATEGORIES) {
    for (const q of cat.queries) {
      rows.push({
        messages: [
          { role: "user", content: q },
          { role: "assistant", content: assistantPayload(cat.slug) },
        ],
      });
    }
  }

  for (const hero of HERO_SUGGESTED_SEARCHES_FALLBACK) {
    const lower = hero.toLowerCase();
    let slug: string | null = null;
    if (lower.includes("transport") || lower.includes("wheelchair")) {
      slug = "accessible-transport";
    } else if (lower.includes("ot ") || lower.includes("occupational")) {
      slug = "occupational-therapy";
    } else if (lower.includes("support worker") || lower.includes("personal")) {
      slug = "personal-care";
    } else if (lower.includes("physio")) {
      slug = "physiotherapy";
    } else if (lower.includes("coordination")) {
      slug = "support-coordination";
    }
    if (slug) {
      rows.push({
        messages: [
          { role: "user", content: hero },
          { role: "assistant", content: assistantPayload(slug) },
        ],
      });
    }
  }

  return rows;
}

async function main(): Promise<void> {
  const outArg = process.argv.find((a) => a.startsWith("--out="));
  const outPath = resolve(
    outArg?.slice("--out=".length) ?? "data/category-classifier-sft.jsonl",
  );

  const rows = buildRows();
  const body = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, body, "utf8");

  console.log(`Wrote ${rows.length} SFT examples to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
