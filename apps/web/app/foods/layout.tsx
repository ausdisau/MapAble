import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export default function FoodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
