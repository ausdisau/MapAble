import Script from "next/script";

import {
  ADSENSE_CLIENT_ID,
  isAdSenseEnabled,
} from "@/lib/ads/adsense-config";

export { ADSENSE_CLIENT_ID };

/**
 * Loads the AdSense script site-wide (required for Auto ads and site verification).
 * Skipped in non-production so localhost does not generate invalid traffic.
 */
export function GoogleAdSense() {
  if (!isAdSenseEnabled()) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
