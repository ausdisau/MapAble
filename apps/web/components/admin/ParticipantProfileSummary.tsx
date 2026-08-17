import { RoleBadge } from "@/components/ui/role-badge";
import type { UserRole } from "@/types/mapable";

export function ParticipantProfileSummary({
  displayName,
  preferredName,
  homeSuburb,
  homeState,
  role,
  email,
}: {
  displayName: string;
  preferredName?: string | null;
  homeSuburb?: string | null;
  homeState?: string | null;
  role: UserRole | string;
  email: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{displayName}</h2>
        <RoleBadge role={role} />
      </div>
      {preferredName ? (
        <p className="text-sm text-muted-foreground">
          Preferred name: {preferredName}
        </p>
      ) : null}
      <p className="text-sm">{email}</p>
      {homeSuburb || homeState ? (
        <p className="text-sm text-muted-foreground">
          Location: {[homeSuburb, homeState].filter(Boolean).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
