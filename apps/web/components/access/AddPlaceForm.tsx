"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddPlaceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/access/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        category: fd.get("category") || "other",
        addressText: fd.get("addressText"),
        suburb: fd.get("suburb"),
        stateOrRegion: fd.get("stateOrRegion"),
        latitude: Number(fd.get("latitude")),
        longitude: Number(fd.get("longitude")),
        description: fd.get("description"),
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Could not submit place");
      return;
    }
    const j = await res.json();
    router.push(`/access/places/${j.place.id}`);
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        Suggested places are moderated before appearing as verified listings.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Place name</span>
        <input name="name" required className="mt-1 min-h-11 w-full rounded-lg border px-3" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Category</span>
        <select name="category" className="mt-1 min-h-11 w-full rounded-lg border px-3">
          <option value="cafe_restaurant">Café / restaurant</option>
          <option value="shop">Shop</option>
          <option value="park">Park</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Address</span>
        <input name="addressText" className="mt-1 min-h-11 w-full rounded-lg border px-3" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Suburb</span>
          <input name="suburb" className="mt-1 min-h-11 w-full rounded-lg border px-3" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">State</span>
          <input name="stateOrRegion" className="mt-1 min-h-11 w-full rounded-lg border px-3" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Latitude</span>
          <input name="latitude" type="number" step="any" required className="mt-1 min-h-11 w-full rounded-lg border px-3" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Longitude</span>
          <input name="longitude" type="number" step="any" required className="mt-1 min-h-11 w-full rounded-lg border px-3" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Notes (optional)</span>
        <textarea name="description" rows={4} className="mt-1 w-full rounded-lg border px-3" />
      </label>
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Suggest place
      </button>
    </form>
  );
}
