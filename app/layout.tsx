import "@/app/index.css";
import "leaflet/dist/leaflet.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";

import { AccessiBeWidget } from "@/components/accessibility/AccessiBeWidget";
import {
  ADSENSE_CLIENT_ID,
  GoogleAdSense,
} from "@/components/ads/GoogleAdSense";
import { Providers } from "@/components/providers";
import { MAPABLE_LOGO_MARK_SRC } from "@/lib/brand/constants";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  // Heading font loads on first h1/logo; avoid unused preload console warnings.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au",
  ),
  title: {
    default: "MapAble | Disability support platform",
    template: "%s | MapAble",
  },
  description:
    "MapAble helps people explore disability support, provider discovery, accessible transport, employment pathways and consent-aware service tools.",
  applicationName: "MapAble",
  icons: {
    icon: [{ url: MAPABLE_LOGO_MARK_SRC, type: "image/svg+xml" }],
    shortcut: [{ url: MAPABLE_LOGO_MARK_SRC, type: "image/svg+xml" }],
    apple: [{ url: MAPABLE_LOGO_MARK_SRC, type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "MapAble",
    title: "MapAble | Disability support platform",
    description:
      "Explore disability support, provider discovery, accessible transport and consent-aware service tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MapAble | Disability support platform",
    description:
      "Explore disability support, provider discovery, accessible transport and consent-aware service tools.",
  },
  other: {
    "purpleads-verification": "832ea0b13123578b63ae2fe9",
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <head>
        <meta
          name="purpleads-verification"
          content="832ea0b13123578b63ae2fe9"
        />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
      </head>
      <body className={plusJakarta.className}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MapAble",
              url:
                process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "support@mapable.com.au",
                areaServed: "AU",
              },
              sameAs: ["https://www.mapable.com.au"],
            }),
          }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MapAble",
              url:
                process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  (process.env.NEXT_PUBLIC_APP_URL ||
                    "https://www.mapable.com.au") +
                  "/provider-finder?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Providers>{children}</Providers>
        <AccessiBeWidget />
        <GoogleAdSense />
        <SpeedInsights />
      </body>
    </html>
  );
}
