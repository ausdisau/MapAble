"use client";

import { useEffect, useState } from "react";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import {
  listOfflinePacks,
  removeOfflinePack,
  saveOfflinePack,
  type OfflineVenuePack,
} from "@/lib/access/indoor/offline/pack-manager";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type OfflinePackPanelProps = {
  venueId: string;
  venueName: string;
  packData: Omit<OfflineVenuePack, "downloadedAt" | "expiresAt">;
};

export function OfflinePackPanel({ venueId, venueName, packData }: OfflinePackPanelProps) {
  const enabled = useIndoorFeatureEnabled("offlineVenuePacks");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    void listOfflinePacks().then((packs) => {
      setSaved(packs.some((p) => p.venueId === venueId));
    });
  }, [enabled, venueId]);

  if (!enabled) return null;

  async function handleSave() {
    try {
      await saveOfflinePack({
        ...packData,
        downloadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setSaved(true);
      setMessage("Venue pack saved for offline use. Status may be stale when offline.");
    } catch {
      setMessage("Could not save offline pack.");
    }
  }

  async function handleRemove() {
    try {
      await removeOfflinePack(venueId);
      setSaved(false);
      setMessage("Offline pack removed.");
    } catch {
      setMessage("Could not remove pack.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="offline-heading">
      <h3 id="offline-heading" className="font-bold text-[#0C1833]">
        Offline venue pack
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Save public floor-plan text and images for {venueName}. Personal access profiles are not
        cached.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!saved ? (
          <button
            type="button"
            onClick={() => void handleSave()}
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Save for offline use
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleRemove()}
            className={`min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
          >
            Remove offline pack
          </button>
        )}
      </div>
      {message ? (
        <p className="mt-2 text-sm text-slate-700" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
