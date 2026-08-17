import { prisma } from "@/lib/prisma";

export async function suggestLineItemForSource(
  sourceType: string,
  sourceId: string,
  hints?: { supportItemCode?: string; serviceType?: string }
) {
  let item = hints?.supportItemCode
    ? await prisma.ndisSupportItem.findFirst({
        where: { code: hints.supportItemCode, active: true },
      })
    : null;

  if (!item && hints?.serviceType) {
    item = await prisma.ndisSupportItem.findFirst({
      where: {
        active: true,
        name: { contains: hints.serviceType, mode: "insensitive" },
      },
    });
  }

  if (!item) {
    item = await prisma.ndisSupportItem.findFirst({
      where: { active: true },
      orderBy: { code: "asc" },
    });
  }

  if (!item) {
    return {
      suggestion: null,
      message: "No support items configured — add items in admin NDIS settings.",
    };
  }

  const suggestion = await prisma.ndisLineItemSuggestion.create({
    data: {
      sourceType,
      sourceId,
      supportItemId: item.id,
      confidence: hints?.supportItemCode ? 0.85 : 0.5,
      explanation: hints?.supportItemCode
        ? `Matched code ${item.code} from service record — requires human review.`
        : `Rule-based suggestion from ${sourceType} — requires human review. Not NDIS approved.`,
    },
  });

  await prisma.ndisRuleWarning.create({
    data: {
      sourceType,
      sourceId,
      warningType: "suggestion_requires_review",
      severity: "info",
      message:
        "Support item suggestion requires human review. Not a claim guarantee.",
    },
  });

  return { suggestion, supportItem: item };
}

export async function importSupportItemsFromRows(
  rows: {
    code: string;
    name: string;
    category?: string;
    unitType?: string;
    priceCapCents?: number;
  }[]
) {
  const results = [];
  for (const row of rows) {
    const item = await prisma.ndisSupportItem.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        name: row.name,
        categoryLabel: row.category,
        unitType: row.unitType,
        priceCapCents: row.priceCapCents,
        active: true,
      },
      update: {
        name: row.name,
        categoryLabel: row.category,
        unitType: row.unitType,
        priceCapCents: row.priceCapCents,
      },
    });
    results.push(item);
  }
  return results;
}
