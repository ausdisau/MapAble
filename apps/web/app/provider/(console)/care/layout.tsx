import { ProviderSectionNav } from "@/components/provider/ProviderSectionNav";
import { PROVIDER_CARE_SUB_LINKS } from "@/lib/platform/core-ui/provider-section-nav";

export default function ProviderCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ProviderSectionNav links={PROVIDER_CARE_SUB_LINKS} ariaLabel="Care sections" />
      {children}
    </div>
  );
}
