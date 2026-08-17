"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsentScopeCard } from "@/components/consent/ConsentScopeCard";
import { Button } from "@/components/ui/button";

export default function ConsentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [consent, setConsent] = useState<{
    scope: string;
    purpose: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/consents")
      .then((r) => r.json())
      .then((data) => {
        const found = data.consents?.find(
          (c: { id: string }) => c.id === id
        );
        if (found) {
          setConsent({
            scope: found.scope ?? found.scopeLabel,
            purpose: found.purpose,
            status: found.status,
          });
        }
      });
  }, [id]);

  if (!consent) {
    return <p>Loading consent…</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/consent" className="text-sm text-primary hover:underline">
        ← Back to consent
      </Link>
      <ConsentScopeCard
        scope={consent.scope}
        purpose={consent.purpose}
        status={consent.status}
      />
      {consent.status === "active" ? (
        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={async () => {
            await fetch(`/api/consents/${id}/revoke`, { method: "POST" });
            router.push("/dashboard/consent");
            router.refresh();
          }}
        >
          Revoke consent
        </Button>
      ) : null}
    </div>
  );
}
