import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
