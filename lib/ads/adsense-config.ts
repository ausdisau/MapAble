/** MapAble Google AdSense publisher ID */
export const ADSENSE_CLIENT_ID = "ca-pub-4510603272878761";

/** Slot id for the marketing footer display unit (`data-ad-slot`). */
export function getAdSenseFooterSlot(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const slot = env.NEXT_PUBLIC_ADSENSE_FOOTER_SLOT?.trim();
  return slot && slot.length > 0 ? slot : undefined;
}

export function isAdSenseEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NEXT_PUBLIC_ADSENSE_ENABLED === "false") return false;
  // Avoid invalid ad traffic from local/dev unless explicitly forced.
  if (env.NODE_ENV !== "production") return false;
  return true;
}

export function canRenderAdSenseDisplayUnit(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isAdSenseEnabled(env) && Boolean(getAdSenseFooterSlot(env));
}

/** Resolve data-ad-slot for a registered unit key. */
export function getAdSenseSlotForUnit(
  unitKey: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  if (unitKey === "marketing.footer") {
    return getAdSenseFooterSlot(env);
  }
  return undefined;
}
