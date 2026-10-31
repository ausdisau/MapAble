/** Independent preview-only feature flag; never enables actual Marketplace checkout. */
export function isCommerceDesignLabEnabled(
  environment: Pick<NodeJS.ProcessEnv, "MAPABLE_COMMERCE_DESIGN_LAB_ENABLED"> = process.env,
): boolean {
  return environment.MAPABLE_COMMERCE_DESIGN_LAB_ENABLED === "true";
}
