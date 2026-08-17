"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RATING_CATEGORIES } from "@/lib/access/reviews/access-rating-service";

const VALUES = [
  "not_applicable",
  "unknown",
  "poor",
  "basic",
  "good",
  "excellent",
] as const;

export function AddAccessReviewForm({ placeId }: { placeId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const ratings = RATING_CATEGORIES.map((category) => ({
      category,
      value: String(fd.get(`rating-${category}`) ?? "unknown"),
    }));

    const res = await fetch(`/api/access/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewBody: fd.get("reviewBody"),
        displayNameMode: fd.get("displayNameMode"),
        mobilityContext: fd.get("mobilityContext"),
        publish: true,
        ratings,
      }),
    });

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Could not submit review");
      return;
    }
    router.push(`/access/places/${placeId}`);
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        Community review — user reported. Not legal certification.
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <fieldset>
        <legend className="font-medium">Public display name</legend>
        <label className="mt-2 flex gap-2">
          <input type="radio" name="displayNameMode" value="anonymous_public" defaultChecked />
          Anonymous to public
        </label>
        <label className="mt-1 flex gap-2">
          <input type="radio" name="displayNameMode" value="first_name" />
          First name only
        </label>
        <label className="mt-1 flex gap-2">
          <input type="radio" name="displayNameMode" value="named" />
          Full name
        </label>
      </fieldset>

      {RATING_CATEGORIES.map((cat) => (
        <fieldset key={cat} className="rounded-lg border border-border p-3">
          <legend className="text-sm font-medium capitalize">
            {cat.replace(/_/g, " ")}
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {VALUES.map((v) => (
              <label key={v} className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name={`rating-${cat}`}
                  value={v}
                  defaultChecked={v === "unknown"}
                  required
                />
                {v.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <label className="block">
        <span className="font-medium">Your experience</span>
        <textarea
          name="reviewBody"
          required
          minLength={10}
          rows={5}
          className="mt-1 w-full rounded-lg border px-3"
        />
      </label>

      <label className="block">
        <span className="text-sm">Mobility context (optional)</span>
        <input name="mobilityContext" className="mt-1 min-h-11 w-full rounded-lg border px-3" />
      </label>

      <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Submit community review
      </button>
    </form>
  );
}
