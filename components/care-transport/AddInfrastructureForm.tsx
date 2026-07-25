"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { InfrastructureDraft } from "@/lib/care-transport-map/infrastructure-draft";

const CATEGORY_OPTIONS = [
  { value: "care_support_hub", label: "Care support hub" },
  { value: "accessible_pickup_point", label: "Accessible pickup point" },
  { value: "transport_depot", label: "Transport depot" },
  { value: "transport_station", label: "Transport station" },
  { value: "health_service", label: "Health service" },
  { value: "community_centre", label: "Community centre" },
  { value: "other", label: "Other" },
] as const;

export function AddInfrastructureForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honesty, setHonesty] = useState<string | null>(null);
  const [draft, setDraft] = useState<InfrastructureDraft | null>(null);

  async function onDraft() {
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch("/api/infrastructure/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not draft suggestion");
        return;
      }
      setDraft(data.draft as InfrastructureDraft);
      setHonesty(data.meta?.honesty ?? null);
    } catch {
      setError("Could not reach MapAble.");
    } finally {
      setDrafting(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const latitude = Number(fd.get("latitude"));
    const longitude = Number(fd.get("longitude"));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Latitude and longitude are required. Draft again or enter coords.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/access/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          category: fd.get("category") || "other",
          addressText: fd.get("addressText") || undefined,
          suburb: fd.get("suburb") || undefined,
          stateOrRegion: fd.get("stateOrRegion") || undefined,
          latitude,
          longitude,
          description: fd.get("description") || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Could not submit place");
        return;
      }
      router.push(`/access/places/${j.place.id}`);
    } catch {
      setError("Could not submit place.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="infra-description" className="block text-sm font-medium">
          Describe the place
        </label>
        <textarea
          id="infra-description"
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='e.g. Accessible pickup bay called "Market Street bay" in Parramatta NSW near the community centre'
        />
        <Button
          type="button"
          variant="default"
          size="default"
          loading={drafting}
          disabled={description.trim().length < 8}
          onClick={() => void onDraft()}
        >
          Draft with GPT / heuristics
        </Button>
        {honesty ? (
          <p className="text-xs text-muted-foreground">{honesty}</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {draft ? (
        <form className="max-w-lg space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <p className="text-sm text-muted-foreground">
            Review the draft, then submit for moderation. Nothing is published
            to OpenStreetMap.org.{" "}
            <Link href="/care-transport/map" className="underline">
              Back to map
            </Link>
          </p>
          <label className="block">
            <span className="text-sm font-medium">Place name</span>
            <input
              name="name"
              required
              defaultValue={draft.name}
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Category</span>
            <select
              name="category"
              defaultValue={draft.category}
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Address</span>
            <input
              name="addressText"
              defaultValue={draft.addressText ?? ""}
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Suburb</span>
              <input
                name="suburb"
                defaultValue={draft.suburb ?? ""}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">State</span>
              <input
                name="stateOrRegion"
                defaultValue={draft.stateOrRegion ?? ""}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Latitude</span>
              <input
                name="latitude"
                type="number"
                step="any"
                required
                defaultValue={draft.latitude ?? ""}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Longitude</span>
              <input
                name="longitude"
                type="number"
                step="any"
                required
                defaultValue={draft.longitude ?? ""}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"
              />
            </label>
          </div>
          {draft.latitude != null && draft.longitude != null ? (
            <p className="text-xs text-muted-foreground">
              Preview pin: {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}{" "}
              (OSM/Nominatim when geocoding is enabled).
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              No coordinates yet. Enable Nominatim geocoding or enter lat/lng
              manually before submitting.
            </p>
          )}
          <label className="block">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={draft.description ?? ""}
              className="mt-1 w-full rounded-lg border px-3"
            />
          </label>
          <Button type="submit" variant="default" size="default" loading={submitting}>
            Suggest place for moderation
          </Button>
        </form>
      ) : null}
    </div>
  );
}
