import { ProviderNdiaClaimsClient } from "@/components/provider/ProviderNdiaClaimsClient";
import { Badge } from "@/components/ui/badge";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "NDIA claims | MapAble Provider",
};

export default async function ProviderNdiaClaimsPage() {
  const user = await requirePermission("provider:ndia:claim");
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];

  if (!organisationId) {
    return (
      <div className={mapablePageContainerClass}>
        <p className="py-8 text-muted-foreground">
          Link your account to a provider organisation to submit NDIA claims.
        </p>
      </div>
    );
  }

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-3xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Registered provider
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          NDIA <span className="text-primary">direct claiming</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Build, validate, and submit claims for agency-managed participants using your
          NDIA partner API credentials.
        </p>
        <div className="mt-10">
          <ProviderNdiaClaimsClient organisationId={organisationId} />
        </div>
      </div>
    </div>
  );
}
