import { MembershipAdminForm } from "@/app/admin/community-membership/MembershipAdminForm";
import { requireAdmin } from "@/lib/auth/guards";
import { listAllMemberships } from "@/lib/community-governance-membership/membership-service";
import { isCommunityGovernanceMembershipV2Enabled } from "@/lib/config/y5-rights-infrastructure";

export default async function CommunityMembershipPage() {
  await requireAdmin();
  const members = await listAllMemberships();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Community membership</h1>
      {!isCommunityGovernanceMembershipV2Enabled() ? (
        <p className="text-amber-800">COMMUNITY_GOVERNANCE_MEMBERSHIP_V2_ENABLED is false.</p>
      ) : null}
      <MembershipAdminForm />
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="rounded border p-3 text-sm">
            {m.memberLabel} — {m.status}
            {m.termEndsAt ? (
              <p className="text-xs text-muted-foreground">
                Term ends: {m.termEndsAt.toLocaleDateString()}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
