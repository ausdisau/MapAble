/** Independent preview-only feature flag; never enables actual Marketplace checkout. */
export function isCommerceDesignLabEnabled(
  value: string | undefined = process.env.MAPABLE_COMMERCE_DESIGN_LAB_ENABLED,
): boolean {
  return value === "true";
}
