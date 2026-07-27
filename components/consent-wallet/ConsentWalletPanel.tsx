"use client";

import { useState } from "react";

type WalletGrant = {
  id: string;
  domain: string;
  actions: string[];
  purpose: string | null;
  expiresAt: string;
  delegate: { id: string; name: string | null; email: string } | null;
};

type WalletDocument = {
  id: string;
  documentId: string;
  purpose: string;
  expiresAt: string;
};

type WalletReceipt = {
  id: string;
  scope: string;
  purpose: string;
  action: string;
  createdAt: string;
};

export function ConsentWalletPanel(props: {
  authority: WalletGrant[];
  documents: WalletDocument[];
  preferentialReceipts: WalletReceipt[];
}) {
  const [authority, setAuthority] = useState(props.authority);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function revokeAuthority(grantId: string) {
    setBusyId(grantId);
    setError(null);
    try {
      const response = await fetch("/api/participant/consent-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          kind: "authority",
          grantId,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Revoke failed");
      }
      setAuthority((current) => current.filter((g) => g.id !== grantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Your consent wallet issues time-limited credentials with preferential
        receipts. It does not replace login or inherit finance/clinical authority
        silently.
      </p>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="wallet-authority-heading">
        <h3 id="wallet-authority-heading" className="font-semibold">
          Authority credentials
        </h3>
        <ul className="mt-3 space-y-2">
          {authority.length === 0 ? (
            <li className="text-sm text-muted-foreground">None active.</li>
          ) : (
            authority.map((grant) => (
              <li
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {grant.delegate?.name ??
                      grant.delegate?.email ??
                      "Unknown delegate"}{" "}
                    · {grant.domain}
                  </div>
                  <div className="text-muted-foreground">
                    {grant.purpose ?? "No purpose recorded"} · expires{" "}
                    {new Date(grant.expiresAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="underline"
                  disabled={busyId === grant.id}
                  onClick={() => void revokeAuthority(grant.id)}
                >
                  Revoke
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section aria-labelledby="wallet-docs-heading">
        <h3 id="wallet-docs-heading" className="font-semibold">
          Document credentials
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {props.documents.length === 0 ? (
            <li className="text-muted-foreground">None active.</li>
          ) : (
            props.documents.map((doc) => (
              <li key={doc.id}>
                Document {doc.documentId} — {doc.purpose} (expires{" "}
                {new Date(doc.expiresAt).toLocaleString()})
              </li>
            ))
          )}
        </ul>
      </section>

      <section aria-labelledby="wallet-receipts-heading">
        <h3 id="wallet-receipts-heading" className="font-semibold">
          Preferential receipts
        </h3>
        <ul className="mt-3 space-y-1 text-sm">
          {props.preferentialReceipts.length === 0 ? (
            <li className="text-muted-foreground">No wallet receipts yet.</li>
          ) : (
            props.preferentialReceipts.map((receipt) => (
              <li key={receipt.id}>
                {receipt.action} · {receipt.scope} · {receipt.purpose}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
