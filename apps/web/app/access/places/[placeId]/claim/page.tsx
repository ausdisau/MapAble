"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

export default function VenueClaimPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = use(params);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/access/places/${placeId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: fd.get("businessName"),
        evidenceNote: fd.get("evidenceNote"),
      }),
    });
    router.push(`/access/places/${placeId}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Claim venue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Claims require admin approval. You cannot remove community reviews.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm font-medium">Business name</span>
          <input name="businessName" required className="mt-1 min-h-11 w-full rounded-lg border px-3" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Evidence</span>
          <textarea name="evidenceNote" rows={4} required className="mt-1 w-full rounded-lg border px-3" />
        </label>
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
          Submit claim
        </button>
      </form>
    </div>
  );
}
