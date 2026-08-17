"use client";

const CATEGORIES = [
  "cafe_restaurant",
  "shop",
  "park",
  "library",
  "transport_station",
  "public_toilet",
  "other",
] as const;

export function AccessFilterPanel({
  category,
  onCategoryChange,
}: {
  category: string;
  onCategoryChange: (c: string) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium">Category</legend>
      <select
        className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-2"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
