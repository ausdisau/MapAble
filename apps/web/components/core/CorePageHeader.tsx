import type { ReactNode } from "react";

// ReactNode used for title with brand colour spans

import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";

export function CorePageHeader({
  title,
  description,
  eyebrow,
  centered,
  children,
  className,
}: {
  title: ReactNode;
  description?: string;
  eyebrow?: string;
  centered?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "space-y-4",
        centered ? "mx-auto max-w-3xl text-center" : "border-b border-border/60 pb-8",
        className
      )}
    >
      {eyebrow ? (
        <Badge variant="outline" className={cn("w-fit", mapableEyebrowBadgeClass, centered && "mx-auto")}>
          {eyebrow}
        </Badge>
      ) : null}
      <h1 className="mapable-display text-3xl font-black leading-tight tracking-[-0.04em] text-[#0C1833] sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className={cn("text-base leading-7 text-slate-600 sm:text-lg", centered && "mx-auto")}>
          {description}
        </p>
      ) : null}
      {children}
    </header>
  );
}
