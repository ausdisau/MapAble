import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata = {
  title: "Provider Finder",
  description:
    "Find NDIS providers, accessible transport, therapy and employment supports with facility-first filters across Australia.",
};

export default function ProviderFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
