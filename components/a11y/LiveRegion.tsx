import { cn } from "@/app/lib/utils";

type LiveRegionProps = {
  message: string;
  /** polite (default) or assertive for urgent map failures */
  politeness?: "polite" | "assertive";
  className?: string;
  id?: string;
};

/** Screen-reader live region for dynamic result/filter/map status updates. */
export function LiveRegion({
  message,
  politeness = "polite",
  className,
  id,
}: LiveRegionProps) {
  return (
    <p
      id={id}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </p>
  );
}
