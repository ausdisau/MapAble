import { StatusBadge } from "@/components/ui/status-badge";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "profile.read": "View basic profile information",
  "accessibility.read": "View accessibility and access needs",
  "booking.read": "View booking details",
  "booking.manage": "Create and manage bookings on your behalf",
  "messages.send": "Send you messages through MapAble",
  "billing.read": "View billing-related information",
  "support_coordination.access": "Support coordination access",
  "plan_manager.invoice_access": "Plan manager invoice access",
  "transport.accessibility_share":
    "Share transport accessibility needs for bookings",
  "transport.trip_access":
    "Allow a family member or nominee to view summary details of your transport trips",
  "care.accessibility_share": "Share care accessibility needs for bookings",
};

export function ConsentScopeCard({
  scope,
  purpose,
  status,
  grantedToName,
}: {
  scope: string;
  purpose: string;
  status: string;
  grantedToName?: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold">{scope}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {SCOPE_DESCRIPTIONS[scope] ?? scope}
      </p>
      <p className="mt-2 text-sm">
        <span className="font-medium">Purpose:</span> {purpose}
      </p>
      {grantedToName ? (
        <p className="mt-1 text-sm">
          <span className="font-medium">Shared with:</span> {grantedToName}
        </p>
      ) : null}
    </article>
  );
}
