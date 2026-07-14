"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const ROLE_OPTIONS = [
  { value: "family_member", label: "Family member" },
  { value: "nominee", label: "Nominee" },
  { value: "support_coordinator", label: "Support coordinator" },
  { value: "plan_manager", label: "Plan manager" },
  { value: "other", label: "Other" },
] as const;

const DOMAIN_OPTIONS = [
  { value: "engagement", label: "Engagement & feedback" },
  { value: "booking", label: "Bookings" },
  { value: "messaging", label: "Messaging" },
  { value: "documents", label: "Documents" },
] as const;

export function DelegateInviteForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = event.currentTarget;
    const data = new FormData(form);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const body = {
      inviteeEmail: String(data.get("inviteeEmail")),
      roleType: String(data.get("roleType")),
      proposedDomain: String(data.get("proposedDomain")),
      proposedActions: [String(data.get("proposedAction"))],
      proposedConsentScopes: data.get("consentScope")
        ? [String(data.get("consentScope"))]
        : [],
      expiresAt: expiresAt.toISOString(),
      message: data.get("message") ? String(data.get("message")) : undefined,
    };

    const response = await fetch("/api/delegates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not send invitation");
      return;
    }

    setSuccess(true);
    form.reset();
    window.location.reload();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Invite someone to help</h2>
      <p className="text-sm text-muted-foreground">
        Financial and clinical domains cannot be delegated through this form.
        Those require separate explicit grants.
      </p>

      <div>
        <label htmlFor="inviteeEmail" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="inviteeEmail"
          name="inviteeEmail"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="roleType" className="block text-sm font-medium">
          Their role
        </label>
        <select
          id="roleType"
          name="roleType"
          required
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="proposedDomain" className="block text-sm font-medium">
          What they can help with
        </label>
        <select
          id="proposedDomain"
          name="proposedDomain"
          required
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          {DOMAIN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="proposedAction" className="block text-sm font-medium">
          Allowed action
        </label>
        <select
          id="proposedAction"
          name="proposedAction"
          required
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="view">View information</option>
          <option value="coordinate">Coordinate on my behalf</option>
          <option value="respond">Respond to messages</option>
        </select>
      </div>

      <div>
        <label htmlFor="consentScope" className="block text-sm font-medium">
          Consent scope (optional)
        </label>
        <input
          id="consentScope"
          name="consentScope"
          type="text"
          placeholder="e.g. booking_summary"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Personal message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={1000}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="text-sm text-green-700">
          Invitation sent.
        </p>
      ) : null}

      <Button type="submit" variant="default" size="default" disabled={loading}>
        {loading ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}

type InvitationRow = {
  id: string;
  inviteeEmail: string;
  roleType: string;
  proposedDomain: string;
  proposedActions: string[];
  status: string;
  expiresAt: string;
  createdAt: string;
};

export function DelegateInvitationList({
  sent,
  received,
}: {
  sent: InvitationRow[];
  received: InvitationRow[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function respond(invitationId: string, response: "accepted" | "declined") {
    setLoadingId(`${invitationId}-${response}`);
    try {
      await fetch("/api/delegates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, response }),
      });
      window.location.reload();
    } finally {
      setLoadingId(null);
    }
  }

  async function revoke(invitationId: string) {
    setLoadingId(`${invitationId}-revoke`);
    try {
      await fetch("/api/delegates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      window.location.reload();
    } finally {
      setLoadingId(null);
    }
  }

  function renderInvitation(invitation: InvitationRow, mode: "sent" | "received") {
    return (
      <li
        key={invitation.id}
        className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-medium">
            {mode === "sent" ? invitation.inviteeEmail : "Invitation to help"}
          </p>
          <p className="text-sm text-muted-foreground">
            {invitation.roleType.replace(/_/g, " ")} ·{" "}
            {invitation.proposedDomain.replace(/_/g, " ")} ·{" "}
            {invitation.status}
          </p>
          <p className="text-xs text-muted-foreground">
            Expires {new Date(invitation.expiresAt).toLocaleDateString("en-AU")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "received" && invitation.status === "pending" ? (
            <>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={loadingId === `${invitation.id}-accepted`}
                onClick={() => void respond(invitation.id, "accepted")}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loadingId === `${invitation.id}-declined`}
                onClick={() => void respond(invitation.id, "declined")}
              >
                Decline
              </Button>
            </>
          ) : null}
          {mode === "sent" &&
          (invitation.status === "pending" || invitation.status === "accepted") ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingId === `${invitation.id}-revoke`}
              onClick={() => void revoke(invitation.id)}
            >
              Revoke
            </Button>
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="sent-invitations-heading">
        <h2 id="sent-invitations-heading" className="text-lg font-semibold">
          Invitations you sent
        </h2>
        {sent.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You have not sent any delegate invitations.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {sent.map((invitation) => renderInvitation(invitation, "sent"))}
          </ul>
        )}
      </section>

      <section aria-labelledby="received-invitations-heading">
        <h2 id="received-invitations-heading" className="text-lg font-semibold">
          Invitations for you
        </h2>
        {received.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No pending invitations addressed to you.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {received.map((invitation) => renderInvitation(invitation, "received"))}
          </ul>
        )}
      </section>
    </div>
  );
}
