"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";

type InviteMeta = {
  status: string;
  organisationName: string;
  emailMasked: string;
  displayName: string | null;
  expiresAt: string;
};

export function WorkerInviteAcceptClient({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const loadInvite = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/worker-invites/${token}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Invite not found");
      return;
    }
    setInvite(data.invite);
  }, [token]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  async function acceptInvite() {
    setAccepting(true);
    setError(null);
    const res = await fetch(`/api/worker-invites/${token}/accept`, {
      method: "POST",
    });
    const data = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not accept invite");
      return;
    }
    setAccepted(true);
    router.push("/worker/onboarding");
    router.refresh();
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading invite…</p>;
  }

  if (!invite) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">
          {error ?? "Invite not found"}
        </p>
        <Link href="/login" className="text-primary underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This invite is {invite.status.replace(/_/g, " ")}.
        </p>
        <Link href="/login" className="text-primary underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (accepted) {
    return <p>Invite accepted. Redirecting…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 p-4">
        <p className="text-sm text-muted-foreground">Organisation</p>
        <p className="text-lg font-semibold">{invite.organisationName}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Invited email: {invite.emailMasked}
        </p>
        {invite.displayName ? (
          <p className="text-sm">Profile name: {invite.displayName}</p>
        ) : null}
      </div>

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="default"
          size="default"
          loading={accepting}
          onClick={() => void acceptInvite()}
        >
          Accept invite (signed in)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => {
            void signIn(undefined, {
              callbackUrl: `/invite/worker/${token}`,
            });
          }}
        >
          Sign in to accept
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        New to MapAble?{" "}
        <Link
          href={`/register?inviteToken=${encodeURIComponent(token)}`}
          className="text-primary underline"
        >
          Create an account with this invite
        </Link>
      </p>
    </div>
  );
}
