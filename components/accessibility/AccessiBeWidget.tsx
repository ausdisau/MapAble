import Script from "next/script";

/**
 * Loads the accessiBe accessibility widget site-wide.
 * Injects the official acsbapp.com loader and calls acsbJS.init() on load.
 */
export function AccessiBeWidget() {
  return (
    <Script id="accessibe" strategy="afterInteractive">
      {`(function(){var s=document.createElement('script');var h=document.querySelector('head')||document.body;s.src='https://acsbapp.com/apps/app/dist/js/app.js';s.async=true;s.onload=function(){acsbJS.init();};h.appendChild(s);})();`}
    </Script>
  );
}
