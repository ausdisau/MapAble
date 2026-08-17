export type ProductAnalyticsProperties = Record<
  string,
  string | number | boolean | undefined
>;

export function isProductAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === "true";
}

export function trackProductEvent(
  eventName: string,
  properties?: ProductAnalyticsProperties,
): void {
  if (typeof window === "undefined") return;
  if (!isProductAnalyticsEnabled()) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[product-analytics]", eventName, properties);
    }
    return;
  }

  const detail = { event: eventName, properties: properties ?? {} };
  window.dispatchEvent(new CustomEvent("mapable-analytics", { detail }));

  if (process.env.NODE_ENV === "development") {
    console.debug("[product-analytics]", eventName, properties);
  }
}
