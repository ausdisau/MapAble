import "@/app/index.css";
import "leaflet/dist/leaflet.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";

import { AccessiBeWidget } from "@/components/accessibility/AccessiBeWidget";
import {
  ADSENSE_CLIENT_ID,
  GoogleAdSense,
} from "@/components/ads/GoogleAdSense";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/JsonLd";
import { isFirstPartyAccessibilityPanelEnabled } from "@/lib/accessibility/feature-flags";
import { getPreHydrationAccessibilityScript } from "@/lib/accessibility/ui-preferences";
import { MAPABLE_LOGO_MARK_SRC } from "@/lib/brand/constants";
import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";
import { buildPublicJsonLd } from "@/lib/config/json-ld";
import {
  CSP_NONCE_HEADER,
  isCspPreviewEnforceEnabled,
} from "@/lib/security/csp-preview-enforce";

const canonicalOrigin = getCanonicalPublicOrigin();
const publicJsonLd = buildPublicJsonLd();
const firstPartyA11yPanel = isFirstPartyAccessibilityPanelEnabled();

const DEFAULT_DESCRIPTION =
  "MapAble Australia helps people find accessible places, NDIS providers, and inclusive community supports — with consent-aware care, transport, and discovery tools.";

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
  metadataBase: new URL(canonicalOrigin),
  title: {
    default:
      "MapAble Australia | Accessible places, NDIS providers & inclusive community",
    template: "%s | MapAble Australia",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: "MapAble Australia",
  keywords: [
    "accessible places",
    "NDIS providers",
    "inclusive community",
    "disability support Australia",
    "MapAble",
    "accessible transport",
    "disability mapping",
  ],
  manifest: "/manifest.webmanifest",
  // Do not pin every page to the apex pathname. Route modules set
  // `alternates.canonical` relative to `metadataBase` so each path resolves
  // to https://mapable.com.au/<path>.
  icons: {
    icon: [{ url: MAPABLE_LOGO_MARK_SRC, type: "image/svg+xml" }],
    shortcut: [{ url: MAPABLE_LOGO_MARK_SRC, type: "image/svg+xml" }],
    apple: [{ url: MAPABLE_LOGO_MARK_SRC, type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    url: canonicalOrigin,
    locale: "en_AU",
    siteName: "MapAble Australia",
    title:
      "MapAble Australia | Accessible places, NDIS providers & inclusive community",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "MapAble Australia | Accessible places, NDIS providers & inclusive community",
    description: DEFAULT_DESCRIPTION,
  },
  other: {
    "purpleads-verification": "832ea0b13123578b63ae2fe9",
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

/**
 * Resolve script nonce only when preview CSP enforce is active (#388 on main).
 * Calling `headers()` opts the tree into dynamic rendering — avoid that when
 * the flag is off so public/static caching remains available.
 * Panel prehydration (#389) also receives this nonce when enforce is on.
 */
async function resolveScriptNonce(): Promise<string | undefined> {
  if (!isCspPreviewEnforceEnabled()) return undefined;
  const headerStore = await headers();
  return headerStore.get(CSP_NONCE_HEADER) ?? undefined;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const scriptNonce = await resolveScriptNonce();

  return (
    <html
      lang="en-AU"
      className={`${plusJakarta.variable} ${outfit.variable}`}
    >
      <head>
        <meta
          name="purpleads-verification"
          content="832ea0b13123578b63ae2fe9"
        />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
        {firstPartyA11yPanel ? (
          <script
            nonce={scriptNonce}
            dangerouslySetInnerHTML={{
              __html: getPreHydrationAccessibilityScript(),
            }}
          />
        ) : null}
      </head>
      <body className={plusJakarta.className}>
        <JsonLd
          nonce={scriptNonce}
          data={[publicJsonLd.organization, publicJsonLd.website]}
        />
        <Providers>{children}</Providers>
        {firstPartyA11yPanel ? null : <AccessiBeWidget />}
        <GoogleAdSense />
        {/* Speed Insights only on Vercel; local/CI production servers have no SI endpoint. */}
        {process.env.VERCEL === "1" ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
