"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type GrantRow = {
  id: string;
  domain: string;
  actions: string[];
  consentScopes: string[];
  purpose: string | null;
  recipientRole: string | null;
  expiresAt: string;
  delegate: {
    id: string;
    name: string | null;
    email: string;
  };
};

export function PeopleWithAccess({ grants }: { grants: GrantRow[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function revokeGrant(grantId: string) {
    setLoadingId(grantId);
    try {
      await fetch("/api/participant-authority", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId }),
      });
      window.location.reload();
    } finally {
      setLoadingId(null);
    }
  }

  if (grants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No one else currently has access to act on your behalf.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {grants.map((grant) => (
        <li
          key={grant.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <p className="font-medium">
              {grant.delegate.name ?? grant.delegate.email}
            </p>
            <p className="text-sm text-muted-foreground">{grant.delegate.email}</p>
            <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div>
                <dt className="inline font-medium">Domain: </dt>
                <dd className="inline">{grant.domain.replace(/_/g, " ")}</dd>
              </div>
              {grant.recipientRole ? (
                <div>
                  <dt className="inline font-medium">Role: </dt>
                  <dd className="inline">
                    {grant.recipientRole.replace(/_/g, " ")}
                  </dd>
                </div>
              ) : null}
              {grant.purpose ? (
                <div>
                  <dt className="inline font-medium">Purpose: </dt>
                  <dd className="inline">{grant.purpose}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline font-medium">Actions: </dt>
                <dd className="inline">{grant.actions.join(", ")}</dd>
              </div>
              {grant.consentScopes.length ? (
                <div>
                  <dt className="inline font-medium">Consent scopes: </dt>
                  <dd className="inline">{grant.consentScopes.join(", ")}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline font-medium">Expires: </dt>
                <dd className="inline">
                  {new Date(grant.expiresAt).toLocaleDateString("en-AU")}
                </dd>
              </div>
            </dl>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingId === grant.id}
            onClick={() => void revokeGrant(grant.id)}
          >
            {loadingId === grant.id ? "Revoking…" : "Revoke access"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
