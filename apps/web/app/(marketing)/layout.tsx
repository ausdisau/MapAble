import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
