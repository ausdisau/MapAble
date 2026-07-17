import Link from "next/link";
import React from "react";


import { Badge } from "@/components/ui/badge";
import type { CanvasBlock, CanvasStatus } from "@/lib/canvas/canvas-data";
import { mapablePublicMutedCardClass } from "@/lib/marketing/public-page-styles";

const statusVariant: Record<
  CanvasStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  MVP: "default",
  Next: "secondary",
  Advanced: "outline",
  Governance: "outline",
};

type CanvasBlockCardProps = {
  block: CanvasBlock;
  showLink?: boolean;
};

export function CanvasBlockCard({ block, showLink = true }: CanvasBlockCardProps) {
  const cardInner = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-black text-mapable-navy">{block.title}</h3>
        <Badge variant={statusVariant[block.status]} aria-label={`Status: ${block.status}`}>
          {block.status}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{block.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Ecosystem links">
        {block.ecosystemLinks.map((link) => (
          <span
            key={link}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-mapable-brand"
          >
            {link}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold text-mapable-navy">What this unlocks: </span>
        <span className="text-slate-600">{block.unlocks}</span>
      </p>
      {showLink && block.href ? (
        <span className="mt-3 inline-block text-sm font-black text-mapable-brand">
          Learn more →
        </span>
      ) : null}
    </>
  );

  if (showLink && block.href) {
    return (
      <Link
        href={block.href}
        className={`${mapablePublicMutedCardClass} block transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none focus:outline-none focus:ring-4 focus:ring-mapable-gold/40`}
      >
        {cardInner}
      </Link>
    );
  }

  return <article className={mapablePublicMutedCardClass}>{cardInner}</article>;
}
