import {
  BillingEmptyState,
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { listBillingPermissions } from "@/lib/billing/permissions";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export default async function BillingSettingsPage() {
  const user = await requireAuth();
  const permissions = listBillingPermissions(user.primaryRole);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Billing settings"
        description="Preferences and access for your Billing Centre role."
      />

      <section
        aria-labelledby="access-heading"
        className={`${mapableSectionCardClass} p-5`}
      >
        <h2 id="access-heading" className="text-lg font-black text-[#0C1833]">
          Your billing permissions
        </h2>
        {permissions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No dedicated billing permissions on this role. Access may be via
            legacy invoice permissions.
          </p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {permissions.map((p) => (
              <li key={p}>
                <code className="rounded bg-white px-1.5 py-0.5 text-xs">
                  {p}
                </code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BillingEmptyState title="Organisation defaults">
        Currency is AUD. Notification and export preferences will be editable
        here once organisation billing settings are exposed.
      </BillingEmptyState>
    </div>
  );
}
