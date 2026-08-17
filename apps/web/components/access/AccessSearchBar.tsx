"use client";

export function AccessSearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      role="search"
    >
      <label htmlFor="access-search" className="sr-only">
        Search places
      </label>
      <input
        id="access-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, suburb, or address"
        className="min-h-11 flex-1 rounded-lg border border-input bg-background px-3 text-base"
      />
      <button
        type="submit"
        className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
      >
        Search
      </button>
    </form>
  );
}
