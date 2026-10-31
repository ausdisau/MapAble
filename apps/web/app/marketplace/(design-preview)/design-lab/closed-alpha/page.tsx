import { MarketplaceAlphaWeb } from "@/components/marketplace/alpha/MarketplaceAlphaWeb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Closed alpha | MapAble Marketplace",
  description: "Private synthetic buyer and seller research prototype. No real product listings or checkout.",
  robots: { index: false, follow: false },
};

/** Rendered only after two default-off server gates and authenticated user admission. */
export default function MarketplaceClosedAlphaPage() {
  return <MarketplaceAlphaWeb />;
}
