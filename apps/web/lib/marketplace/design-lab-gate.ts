/** Independent preview-only feature flag; never enables actual Marketplace checkout. */
export function isCommerceDesignLabEnabled(
  environment: { MAPABLE_COMMERCE_DESIGN_LAB_ENABLED?: string } = process.env,
): boolean {
  return environment.MAPABLE_COMMERCE_DESIGN_LAB_ENABLED === "true";
}
