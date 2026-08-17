import { ProviderSectionNav } from "@/components/provider/ProviderSectionNav";
import { PROVIDER_TRANSPORT_SUB_LINKS } from "@/lib/platform/core-ui/provider-section-nav";

export default function ProviderTransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ProviderSectionNav
        links={PROVIDER_TRANSPORT_SUB_LINKS}
        ariaLabel="Transport sections"
      />
      {children}
    </div>
  );
}
