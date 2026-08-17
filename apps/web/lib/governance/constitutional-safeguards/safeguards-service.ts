import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

const DEFAULT_ARTICLES = [
  {
    articleKey: "human_review",
    title: "Human review for high-impact decisions",
    body: "Automated matching and dispatch recommendations require human confirmation.",
    sortOrder: 1,
  },
  {
    articleKey: "data_minimisation",
    title: "Data minimisation",
    body: "Only collect and share data necessary for the stated service purpose.",
    sortOrder: 2,
  },
  {
    articleKey: "small_cell",
    title: "Small-cell suppression",
    body: "Public metrics are suppressed when cohorts are too small to protect privacy.",
    sortOrder: 3,
  },
];

export async function ensureDefaultSafeguards() {
  for (const a of DEFAULT_ARTICLES) {
    await prisma.constitutionalSafeguard.upsert({
      where: { articleKey: a.articleKey },
      create: { ...a, status: "active", ratifiedAt: new Date() },
      update: {},
    });
  }
}

export async function listActiveSafeguards() {
  if (!phase12Config.constitutionalSafeguardsEnabled) return [];
  await ensureDefaultSafeguards();
  return prisma.constitutionalSafeguard.findMany({
    where: { status: "active" },
    orderBy: { sortOrder: "asc" },
  });
}
