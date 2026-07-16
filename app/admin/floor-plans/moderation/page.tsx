"use client";

import { useEffect, useState } from "react";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";

type Proposal = {
  id: string;
  placeId: string;
  correctionType: string;
  description: string;
  status: string;
  createdAt: string;
};

export default function FloorPlanModerationPage() {
  const enabled = useIndoorFeatureEnabled("floorPlanCommunityCorrections");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    void fetch("/api/indoor/corrections")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load queue");
        const data = await res.json();
        setProposals(data.proposals ?? []);
      })
      .catch(() => setError("Moderator sign-in required or feature disabled."));
  }, [enabled]);

  if (!enabled) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-black">Correction moderation</h1>
        <p className="mt-4 text-slate-600">Community corrections are disabled in this environment.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-black">Floor plan correction queue</h1>
      <p className="text-slate-600">
        Accepted corrections create a new draft or incident — they never overwrite published data
        directly.
      </p>

      {error ? <p className="text-red-800">{error}</p> : null}

      {proposals.length === 0 ? (
        <p className="text-slate-600">No pending proposals.</p>
      ) : (
        <ul className="space-y-4">
          {proposals.map((p) => (
            <li key={p.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold">{p.correctionType.replace(/_/g, " ")}</p>
              <p className="mt-2 text-sm">{p.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Venue {p.placeId} · {new Date(p.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
