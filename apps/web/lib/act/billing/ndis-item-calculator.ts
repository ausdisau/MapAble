import {
  getActCatalogueItem,
  type ActCatalogueItem,
} from "@/lib/act/billing/catalogue";
import { isActLayerEnabled } from "@/lib/act/flags";

export type ActDraftLineStatus = "draft_requires_review";

export type ActDraftLineItem = {
  supportItemCode: string;
  description: string;
  quantityHours: number;
  unitRateCents: number;
  totalAmountCents: number;
  status: ActDraftLineStatus;
  catalogue: ActCatalogueItem;
  messages: string[];
};

export type CalculateNdisDraftInput = {
  supportItemCode: string;
  /** Billable hours (fractional allowed). */
  hours: number;
  /** Optional override rate; otherwise catalogue example rate. */
  unitRateCents?: number;
  description?: string;
};

/**
 * Hours × catalogue rate → draft line items.
 * Status is always `draft_requires_review` — never auto-approved.
 */
export function calculateNdisItemDraft(
  input: CalculateNdisDraftInput,
): ActDraftLineItem {
  if (!isActLayerEnabled() && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_ACT_LAYER_DISABLED");
  }

  const messages: string[] = [];
  const catalogue = getActCatalogueItem(input.supportItemCode);
  if (!catalogue) {
    throw new Error(`ACT_UNKNOWN_SUPPORT_ITEM:${input.supportItemCode}`);
  }

  if (!(input.hours > 0) || !Number.isFinite(input.hours)) {
    throw new Error("ACT_INVALID_HOURS");
  }
  if (input.hours > 24 * 14) {
    messages.push("Hours exceed typical fortnightly band — human review required");
  }

  const unitRateCents = input.unitRateCents ?? catalogue.unitRateCents;
  if (!(unitRateCents > 0) || !Number.isInteger(unitRateCents)) {
    throw new Error("ACT_INVALID_UNIT_RATE");
  }

  const totalAmountCents = Math.round(input.hours * unitRateCents);
  messages.push(
    "Draft only — automated claim/payment approval is permanently prohibited",
  );

  return {
    supportItemCode: catalogue.supportItemCode,
    description:
      input.description ??
      `${catalogue.name} (${input.hours} ${catalogue.unit}${input.hours === 1 ? "" : "s"})`,
    quantityHours: input.hours,
    unitRateCents,
    totalAmountCents,
    status: "draft_requires_review",
    catalogue,
    messages,
  };
}

export function calculateNdisItemDrafts(
  lines: CalculateNdisDraftInput[],
): {
  lines: ActDraftLineItem[];
  totalCents: number;
  status: ActDraftLineStatus;
} {
  const drafted = lines.map(calculateNdisItemDraft);
  return {
    lines: drafted,
    totalCents: drafted.reduce((sum, l) => sum + l.totalAmountCents, 0),
    status: "draft_requires_review",
  };
}
