import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export default function MovesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
