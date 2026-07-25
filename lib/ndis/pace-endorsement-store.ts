/**
 * Scaffold in-memory PACE budget / quarterly pacing overlay.
 * No Prisma table (feature freeze).
 */

export type PaceBudgetOverlay = {
  participantId: string;
  supportCategoryCode: string;
  expirationDate: string;
  remainingCategoryBudget: number;
  totalCategoryBudget: number;
  ndisNumber?: string;
  planStartDate?: string;
  planEndDate?: string;
  quarterlyAllocationAUD?: number;
  quarterSpentAUD?: number;
};

const overlays = new Map<string, PaceBudgetOverlay>();

function key(participantId: string, categoryCode: string) {
  return `${participantId}::${categoryCode}`;
}

export function seedPaceBudgetOverlay(overlay: PaceBudgetOverlay): void {
  overlays.set(key(overlay.participantId, overlay.supportCategoryCode), overlay);
}

export function clearPaceBudgetOverlays(): void {
  overlays.clear();
}

export function getPaceBudgetOverlay(
  participantId: string,
  categoryCode: string
): PaceBudgetOverlay | null {
  return overlays.get(key(participantId, categoryCode)) ?? null;
}

export function defaultPaceBudgetOverlay(
  participantId: string,
  categoryCode: string
): PaceBudgetOverlay {
  const existing = getPaceBudgetOverlay(participantId, categoryCode);
  if (existing) return existing;
  const now = new Date();
  const planStart = new Date(now.getFullYear(), 0, 1);
  const planEnd = new Date(now.getFullYear(), 11, 31);
  return {
    participantId,
    supportCategoryCode: categoryCode,
    expirationDate: planEnd.toISOString(),
    remainingCategoryBudget: 12_000,
    totalCategoryBudget: 20_000,
    planStartDate: planStart.toISOString(),
    planEndDate: planEnd.toISOString(),
    quarterlyAllocationAUD: 5_000,
    quarterSpentAUD: 1_200,
  };
}
