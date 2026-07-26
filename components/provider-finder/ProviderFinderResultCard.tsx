"use client";

import { ArrowRight, Bookmark, MessageCircle, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

import { cn } from "@/app/lib/utils";
import type { Provider } from "@/app/provider-finder/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformCareLink } from "@/lib/provider/use-platform-care-link";

function formatLocation(provider: Provider) {
  if (provider.suburb === "Remote") return "Telehealth (Australia-wide)";
  return `${provider.suburb} ${provider.state}`;
}

function providerBlurb(provider: Provider) {
  const primary = provider.categories[0] ?? "Disability support";
  return `${provider.name} offers ${primary.toLowerCase()} and related supports for participants who want practical, access-aware service options nearby.`;
}

function availabilityLabel(provider: Provider) {
  if (provider.suburb === "Remote") return "Telehealth slots open";
  if (provider.registered) return "Available this week";
  return "Enquire for availability";
}

function responseLabel(provider: Provider) {
  if (provider.reviewCount >= 100) return "Usually replies in 2 hours";
  if (provider.reviewCount >= 30) return "Usually replies same day";
  return "Response time varies";
}

function fundingLabel(provider: Provider) {
  return provider.registered ? "NDIS registered" : "Private / plan flexible";
}

type ProviderFinderResultCardProps = {
  provider: Provider;
  isSelected?: boolean;
  isCompared?: boolean;
  onSelect?: (provider: Provider) => void;
  onToggleCompare?: (provider: Provider) => void;
};

export function ProviderFinderResultCard({
  provider,
  isSelected,
  isCompared,
  onSelect,
  onToggleCompare,
}: ProviderFinderResultCardProps) {
  const { careRequestHref } = usePlatformCareLink(provider);
  const rating = Math.max(0, Math.min(5, provider.rating));
  const showDistance =
    provider.distanceKm > 0 && provider.suburb !== "Remote";
  const featured = provider.rating >= 4.7 && provider.reviewCount >= 50;

  return (
    <article
      className={cn(
        "rounded-xl border border-border/60 bg-card p-5 shadow-sm transition",
        isSelected && "border-primary/30 ring-2 ring-primary/15",
      )}
    >
      <div className="flex flex-wrap items-start gap-2">
        {provider.registered ? (
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary"
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
            Verified profile
          </Badge>
        ) : null}
        {featured ? (
          <Badge variant="outline" className="border-secondary/30 bg-secondary/5 text-secondary">
            Featured partner
          </Badge>
        ) : null}
        <div className="ml-auto flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-semibold">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({provider.reviewCount} reviews)</span>
        </div>
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onSelect?.(provider)}
        aria-label={`Select ${provider.name} in ${formatLocation(provider)}`}
        aria-pressed={Boolean(isSelected)}
      >
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {provider.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {provider.categories[0] ?? "Support services"}
          {showDistance ? (
            <>
              {" "}
              · {formatLocation(provider)} · {provider.distanceKm.toFixed(1)} km
            </>
          ) : (
            <> · {formatLocation(provider)}</>
          )}
        </p>
      </button>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {providerBlurb(provider)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {provider.categories.slice(0, 2).map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs text-foreground"
          >
            {cat}
          </span>
        ))}
        {provider.supports.includes("Telehealth") ? (
          <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs text-foreground">
            Telehealth
          </span>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center sm:gap-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Availability
          </dt>
          <dd className="mt-1 text-xs font-medium text-foreground sm:text-sm">
            {availabilityLabel(provider)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Response
          </dt>
          <dd className="mt-1 text-xs font-medium text-foreground sm:text-sm">
            {responseLabel(provider)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Funding
          </dt>
          <dd className="mt-1 text-xs font-medium text-foreground sm:text-sm">
            {fundingLabel(provider)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {careRequestHref ? (
          <Button variant="default" size="default" asChild className="gap-1.5">
            <Link href={careRequestHref}>Request care</Link>
          </Button>
        ) : null}
        <Button
          variant={careRequestHref ? "outline" : "default"}
          size="default"
          asChild
          className="gap-1.5"
        >
          <Link href={`/jonathan/profile/${encodeURIComponent(provider.slug)}`}>
            View profile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => onToggleCompare?.(provider)}
          aria-pressed={Boolean(isCompared)}
          aria-label={
            isCompared
              ? `Remove ${provider.name} from comparison`
              : `Add ${provider.name} to comparison`
          }
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {isCompared ? "Compared" : "Compare"}
        </Button>
        <Button type="button" variant="outline" size="default" asChild>
          <Link
            href={`/provider-finder?provider=${encodeURIComponent(provider.slug)}#ask-panel`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Ask MapAble
          </Link>
        </Button>
      </div>
    </article>
  );
}
