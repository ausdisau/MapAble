import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export function CareListCard({
  href,
  title,
  subtitle,
  status,
  meta,
  className,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  status: string;
  meta?: string;
  className?: string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
        {meta ? (
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <StatusBadge status={status} />
        {href ? (
          <ChevronRight
            className="h-5 w-5 text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>
    </>
  );

  const classNames = cn(
    "flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition",
    href && "hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {inner}
      </Link>
    );
  }

  return <article className={classNames}>{inner}</article>;
}
