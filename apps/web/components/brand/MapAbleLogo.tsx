import Image from "next/image";
import Link from "next/link";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_LOGO_ALT,
  MAPABLE_LOGO_MARK_SRC,
  MAPABLE_LOGO_SRC,
} from "@/lib/brand/constants";

export type MapAbleLogoVariant = "full" | "mark" | "text";

export function MapAbleLogo({
  href = "/",
  title = "MapAble",
  subtitle,
  className,
  variant = "text",
  ariaLabel = "MapAble home",
}: {
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** full = brand image with wordmark; mark = icon only; text = mark + optional title */
  variant?: MapAbleLogoVariant;
  /** Accessible name for the logo link */
  ariaLabel?: string;
}) {
  const linkClass = cn(
    "inline-flex min-w-0 shrink-0 bg-transparent outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    variant === "full" ? "items-center" : "items-center gap-3",
    className,
  );

  if (variant === "full") {
    return (
      <Link href={href} className={linkClass} aria-label={ariaLabel}>
        {/* Native img so replacing public/brand/mapable-logo.png via GitHub does not require code changes. */}
        <img
          src={MAPABLE_LOGO_SRC}
          alt={MAPABLE_LOGO_ALT}
          width={754}
          height={1008}
          className="block h-12 w-auto max-h-16 shrink-0 bg-transparent object-contain object-left sm:h-14"
          decoding="async"
          fetchPriority="high"
        />
      </Link>
    );
  }

  return (
    <Link href={href} className={linkClass} aria-label={ariaLabel}>
      <Image
        src={MAPABLE_LOGO_MARK_SRC}
        alt=""
        width={48}
        height={52}
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
        aria-hidden
      />
      {variant === "text" ? (
        <span className="min-w-0 truncate font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
          {subtitle ? (
            <span className="mt-0.5 hidden truncate text-xs font-normal text-muted-foreground sm:block">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
