import { Badge } from "@/components/ui/badge";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export default async function NdisClaimsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("provider:ndis:claim");
  const user = await requirePermission("provider:ndis:claim");
  const orgIds = await getUserOrganisationIds(user.id);

  if (!orgIds[0]) {
    return (
      <div className={mapablePageContainerClass}>
        <p className="py-8 text-muted-foreground">
          Link your account to a provider organisation to use NDIS direct claiming.
        </p>
      </div>
    );
  }

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-5xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Portal-assisted claiming
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          NDIS <span className="text-primary">direct claiming</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Convert delivered services into validated claim lines, route by funding type, and
          export invoices or bulk payment requests. No government portal passwords are stored.
        </p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
