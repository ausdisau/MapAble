import { CareRequestWizard } from "@/components/care/CareRequestWizard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";

export default async function CareRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    organisationId?: string;
    providerName?: string;
    preferredOrganisationName?: string;
  }>;
}) {
  const user = await requirePermission("care:manage:self");
  const params = await searchParams;
  const preferredProviderName =
    params.providerName ?? params.preferredOrganisationName;

  return (
    <div className="space-y-8">
      <CorePageHeader
        eyebrow="Request support"
        title="Describe what you need"
        description="Step 1: tell us in plain language. Step 2: review your draft care plan before anything is booked."
        className="border-0 pb-0"
      />
      <Card variant="gradient" className="shadow-md">
        <CardContent className="p-5 sm:p-8">
          <CareRequestWizard
            participantId={user.id}
            preferredOrganisationId={params.organisationId}
            preferredProviderName={preferredProviderName}
          />
        </CardContent>
      </Card>
    </div>
  );
}
