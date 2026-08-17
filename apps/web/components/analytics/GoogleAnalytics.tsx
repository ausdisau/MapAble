import Script from "next/script";

import {
  GA_MEASUREMENT_ID,
  isGoogleAnalyticsEnabled,
} from "@/lib/analytics/ga-config";

/**
 * Loads gtag.js site-wide for GA4 page views.
 * Skipped in non-production so localhost does not generate invalid traffic.
 */
export function GoogleAnalytics() {
  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
`}
      </Script>
    </>
  );
}
