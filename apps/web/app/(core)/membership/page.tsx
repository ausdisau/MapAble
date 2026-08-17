import {
  getMembershipDisclaimer,
  listPublicMembershipDirectory,
} from "@/lib/governance/community-membership/membership-service";

export default async function MembershipDirectoryPage() {
  const members = await listPublicMembershipDirectory();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Community governance membership</h1>
      <p className="text-muted-foreground">
        Public directory labels only — no personal contact details.
      </p>
      <p className="text-xs text-muted-foreground">{getMembershipDisclaimer()}</p>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="rounded border p-3 text-sm">
            {m.memberLabel} — {m.membershipType}
            {m.region ? ` (${m.region})` : ""}
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
