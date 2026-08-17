import { NON_ADVISORY_DISCLAIMER, y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { prisma } from "@/lib/prisma";
import { getMockNdisPlanSummary } from "@/lib/prms/mockPrmsData";
import type { BudgetBand } from "@/lib/prms/types";

export { NON_ADVISORY_DISCLAIMER };

export function isBudgetGuidanceEnabled() {
  return y3NationalTrustConfig.budgetGuidanceEnabled;
}

const ADVICE_BLOCKLIST = /\b(you should|you must|claim now|spend on|overspend|underspend)\b/i;

export function assertNonAdvisoryCopy(text: string) {
  if (ADVICE_BLOCKLIST.test(text)) {
    throw new Error("NON_ADVISORY_COPY_VIOLATION");
  }
}

export type BudgetCategorySnapshot = {
  category: string;
  band: BudgetBand;
  description: string;
};

export async function getBudgetSnapshot(participantId: string) {
  if (!isBudgetGuidanceEnabled()) {
    return { enabled: false, disclaimer: NON_ADVISORY_DISCLAIMER };
  }

  const plan = getMockNdisPlanSummary(participantId);
  const invoiceLines = await prisma.invoiceLine.findMany({
    where: {
      invoice: {
        participantId,
        createdAt: { gte: new Date(Date.now() - 90 * 86400000) },
      },
    },
    select: { description: true, totalAmountCents: true },
    take: 100,
  });

  const totalSpendCents = invoiceLines.reduce(
    (sum, line) => sum + line.totalAmountCents,
    0
  );

  const categories: BudgetCategorySnapshot[] = [
    {
      category: "Core supports",
      band: plan?.overallBudgetBand ?? "watch",
      description: getCategoryGuidance("core"),
    },
    {
      category: "Capacity building",
      band: totalSpendCents > 500000 ? "watch" : "healthy",
      description: getCategoryGuidance("capacity"),
    },
    {
      category: "Capital",
      band: "healthy",
      description: getCategoryGuidance("capital"),
    },
  ];

  return {
    enabled: true,
    disclaimer: NON_ADVISORY_DISCLAIMER,
    planStatus: plan?.status ?? "unknown",
    fundingManagement: plan?.fundingManagement ?? "unknown",
    overallBudgetBand: plan?.overallBudgetBand ?? "watch",
    categories,
    recentActivityCount: invoiceLines.length,
    informationalOnly: true,
  };
}

export function getCategoryGuidance(categoryKey: string): string {
  const copy: Record<string, string> = {
    core:
      "Core supports cover everyday assistance. This band reflects recent activity patterns only — not a spending recommendation.",
    capacity:
      "Capacity building supports skill development. Compare trends with your plan manager or coordinator for context.",
    capital:
      "Capital supports relate to equipment and home modifications. Eligibility rules are set by your plan.",
  };
  const text = copy[categoryKey] ?? "Category information is for visibility only.";
  assertNonAdvisoryCopy(text);
  return text;
}

export function formatBudgetCopilotAnswer(participantId: string) {
  const plan = getMockNdisPlanSummary(participantId);
  const answer = `${NON_ADVISORY_DISCLAIMER} Your plan status appears as ${plan?.status ?? "unknown"} with an overall budget band of ${plan?.overallBudgetBand ?? "watch"}. For exact amounts and claims, contact your plan manager.`;
  assertNonAdvisoryCopy(answer);
  return answer;
}
