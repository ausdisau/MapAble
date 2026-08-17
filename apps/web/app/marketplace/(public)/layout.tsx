import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export default function MarketplacePublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
