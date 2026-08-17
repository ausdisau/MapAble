"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type OrganisationOption = { id: string; name: string };

type PendingInvite = {
  id: string;
  email: string;
  displayName: string | null;
  expiresAt: string;
};

export function ProviderWorkerInviteForm({
  organisations,
  initialOrganisationId,
}: {
  organisations: OrganisationOption[];
  initialOrganisationId?: string;
}) {
  const router = useRouter();
  const [organisationId, setOrganisationId] = useState(
    initialOrganisationId ?? organisations[0]?.id ?? ""
  );
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const loadInvites = useCallback(async (orgId: string) => {
    if (!orgId) return;
    const res = await fetch(`/api/organisations/${orgId}/workers/invites`);
    if (res.ok) {
      const data = await res.json();
      setPendingInvites(data.invites ?? []);
    }
  }, []);

  useEffect(() => {
    if (organisationId) void loadInvites(organisationId);
  }, [organisationId, loadInvites]);

  return (
    <div className="space-y-8">
      <form
        className="max-w-xl space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          setSuccess(null);
          setInviteUrl(null);

          const res = await fetch(
            `/api/organisations/${organisationId}/workers/invite`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, displayName: displayName || undefined }),
            }
          );
          const data = await res.json();
          setLoading(false);

          if (!res.ok) {
            setError(data.error ?? "Invite failed");
            return;
          }

          setSuccess(`Invite sent to ${email}`);
          setInviteUrl(data.invite?.inviteUrl ?? null);
          setEmail("");
          setDisplayName("");
          await loadInvites(organisationId);
          router.refresh();
        }}
      >
        <h2 className="font-heading text-xl font-semibold">Invite a worker</h2>

        {organisations.length > 1 ? (
          <AccessibleFormField id="org-picker" label="Organisation" required>
            <select
              id="org-picker"
              className={formInputClass}
              value={organisationId}
              onChange={(e) => {
                setOrganisationId(e.target.value);
                void loadInvites(e.target.value);
              }}
              required
            >
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </AccessibleFormField>
        ) : null}

        <AccessibleFormField id="worker-email" label="Worker email" required>
          <input
            id="worker-email"
            type="email"
            className={formInputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="worker-display-name"
          label="Display name"
          hint="Optional — shown on their profile until they complete setup."
        >
          <input
            id="worker-display-name"
            type="text"
            className={formInputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </AccessibleFormField>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-green-700">{success}</p>
        ) : null}
        {inviteUrl ? (
          <p className="rounded-lg border border-border/60 bg-muted p-3 text-sm">
            Share this invite link:{" "}
            <a href={inviteUrl} className="break-all text-primary underline">
              {inviteUrl}
            </a>
          </p>
        ) : null}

        <Button
          type="submit"
          variant="default"
          size="default"
          loading={loading}
          disabled={!organisationId}
        >
          Send invite
        </Button>
      </form>

      {pendingInvites.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-medium">Pending invites</h3>
          <ul className="divide-y rounded-lg border border-border/60">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  {invite.displayName ? (
                    <p className="text-muted-foreground">{invite.displayName}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const res = await fetch(
                      `/api/organisations/${organisationId}/workers/invites/${invite.id}`,
                      { method: "DELETE" }
                    );
                    if (res.ok) {
                      await loadInvites(organisationId);
                      router.refresh();
                    }
                  }}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
