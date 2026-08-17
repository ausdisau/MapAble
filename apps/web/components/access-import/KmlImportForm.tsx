"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function KmlImportForm({ networkLinkUrl }: { networkLinkUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, importType: "kml" | "geojson") {
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("importType", importType);
    const res = await fetch("/api/admin/access/import/kml", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      setError("Import failed");
      return;
    }
    const j = await res.json();
    router.push(`/admin/access/import/${j.importId}`);
  }

  async function fetchNetworkLink() {
    setError(null);
    const res = await fetch("/api/admin/access/import/kml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ networkLinkUrl }),
    });
    if (!res.ok) {
      setError("NetworkLink fetch failed (URL may be blocked or unavailable)");
      return;
    }
    const j = await res.json();
    router.push(`/admin/access/import/${j.importId}`);
  }

  return (
    <div className="max-w-lg space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Upload file</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <label className="block">
        <span className="text-sm">KML file (e.g. MapAble.kml)</span>
        <input
          type="file"
          accept=".kml,.xml"
          className="mt-1 block w-full"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f, "kml");
          }}
        />
      </label>
      <label className="block">
        <span className="text-sm">GeoJSON (e.g. accessible_locations_merged.geojson)</span>
        <input
          type="file"
          accept=".geojson,.json"
          className="mt-1 block w-full"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f, "geojson");
          }}
        />
      </label>
      <button
        type="button"
        className="min-h-11 rounded-lg border px-4 text-sm"
        onClick={() => void fetchNetworkLink()}
      >
        Import allowlisted Google My Maps
      </button>
      <p className="text-xs text-muted-foreground break-all">Source: {networkLinkUrl}</p>
    </div>
  );
}
