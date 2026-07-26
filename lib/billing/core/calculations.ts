import { billingCoreConfig } from "@/lib/billing/core/config";

export type LineItemCalcInput = {
  quantity: number;
  unitAmountCents: number;
  gstApplicable?: boolean;
};

export function lineItemTotalCents(item: LineItemCalcInput): number {
  const qty = item.quantity;
  return Math.round(qty * item.unitAmountCents);
}

export function calculateSubtotalCents(items: LineItemCalcInput[]): number {
  return items.reduce((sum, item) => sum + lineItemTotalCents(item), 0);
}

export function calculateGstCents(items: LineItemCalcInput[]): number {
  const rate = billingCoreConfig.gstBps / 10_000;
  return items.reduce((sum, item) => {
    if (!item.gstApplicable) return sum;
    const lineTotal = lineItemTotalCents(item);
    return sum + Math.round(lineTotal * rate);
  }, 0);
}

/** Platform fee on subtotal (before GST), in cents. */
export function calculatePlatformFeeCents(subtotalCents: number): number {
  const rate = billingCoreConfig.platformFeeBps / 10_000;
  return Math.round(subtotalCents * rate);
}

export function calculateInvoiceTotals(items: LineItemCalcInput[]): {
  subtotalCents: number;
  gstCents: number;
  platformFeeCents: number;
  totalCents: number;
} {
  const subtotalCents = calculateSubtotalCents(items);
  const gstCents = calculateGstCents(items);
  const platformFeeCents = calculatePlatformFeeCents(subtotalCents);
  const totalCents = subtotalCents + gstCents + platformFeeCents;
  return { subtotalCents, gstCents, platformFeeCents, totalCents };
}
