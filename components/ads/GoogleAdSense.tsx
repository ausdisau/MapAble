import Script from "next/script";

/** MapAble Google AdSense publisher ID */
export const ADSENSE_CLIENT_ID = "ca-pub-4510603272878761";

/**
 * Loads the AdSense script site-wide (required for Auto ads and site verification).
 * Skipped in non-production so localhost does not generate invalid traffic.
 */
export function GoogleAdSense() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  if (process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "false") {
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
