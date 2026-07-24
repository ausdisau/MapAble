import { cn } from "@/app/lib/utils";
import type { HTMLAttributes } from "react";

/** Non-interactive placeholder for loading grids — avoids layout shift. */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/80 motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SearchResultCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4"
      role="status"
      aria-label="Loading search result"
    >
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-4 h-16 w-full" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export function SearchResultGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      role="status"
      aria-busy="true"
      aria-label="Loading search results"
    >
      {Array.from({ length: count }, (_, i) => (
        <SearchResultCardSkeleton key={i} />
      ))}
    </div>
  );
}
