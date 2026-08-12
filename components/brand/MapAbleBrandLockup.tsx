import Link from "next/link";

import { cn } from "@/app/lib/utils";
import {
  MAPABLE_BRAND_TAGLINE,
  MAPABLE_LOGO_WORDMARK_SRC,
} from "@/lib/brand/constants";

export type MapAbleBrandLockupSize = "header" | "hero";

const sizeStyles: Record<
  MapAbleBrandLockupSize,
  { image: string; pill: string; stack: string }
> = {
  header: {
    stack: "gap-1.5",
    image:
      "block h-[2.8125rem] w-auto max-h-[3.125rem] max-w-[9.5rem] shrink-0 bg-transparent object-contain object-center sm:h-[3.125rem] sm:max-w-[11rem]",
    pill: "px-2.5 py-1 text-[0.55rem] tracking-[0.08em] sm:px-3 sm:text-[0.62rem] sm:tracking-[0.1em]",
  },
  hero: {
    stack: "gap-2",
    image:
      "block h-14 w-auto max-h-16 max-w-[12rem] shrink-0 bg-transparent object-contain object-center sm:h-16 sm:max-w-[14rem]",
    pill: "px-3 py-1 text-[0.62rem] tracking-[0.1em] sm:px-3.5 sm:text-[0.68rem] sm:tracking-[0.12em]",
  },
};

/**
 * Centered MapAble mark + wordmark with a width-fitted tagline pill beneath.
 * Avoids the full PNG’s oversized baked-in tagline and left-heavy clip hacks.
 */
export function MapAbleBrandLockup({
  href = "/",
  size = "header",
  className,
  ariaLabel = `MapAble home — ${MAPABLE_BRAND_TAGLINE}`,
  onClick,
}: {
  href?: string;
  size?: MapAbleBrandLockupSize;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const styles = sizeStyles[size];

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-0 flex-col items-center rounded-2xl p-1 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C]",
        styles.stack,
        className,
      )}
    >
      <img
        src={MAPABLE_LOGO_WORDMARK_SRC}
        alt=""
        width={754}
        height={940}
        className={styles.image}
        decoding="async"
        fetchPriority="high"
        aria-hidden
      />
      <span
        className={cn(
          "inline-flex w-fit max-w-full items-center justify-center rounded-full bg-[#0C1833] text-center font-black uppercase leading-none text-[#F8C51C]",
          styles.pill,
        )}
      >
        {MAPABLE_BRAND_TAGLINE}
      </span>
    </Link>
  );
}
