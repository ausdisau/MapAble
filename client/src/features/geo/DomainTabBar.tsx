import { Accessibility, HeartHandshake, Bus, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOMAIN_LABELS, type GeoDomain } from "./types";

const DOMAIN_ICONS: Record<GeoDomain, typeof Accessibility> = {
  accessibility: Accessibility,
  care: HeartHandshake,
  transport: Bus,
  employment: Briefcase,
};

const DOMAIN_ORDER: GeoDomain[] = ["accessibility", "care", "transport", "employment"];

interface DomainTabBarProps {
  active: GeoDomain;
  onChange: (domain: GeoDomain) => void;
}

export function DomainTabBar({ active, onChange }: DomainTabBarProps) {
  return (
    <>
    <div
      role="status"
      aria-live="polite"
      className="sr-only"
      data-testid="text-domain-announcement"
    >
      {`${DOMAIN_LABELS[active]} map layers now showing`}
    </div>
    <div
      role="tablist"
      aria-label="Map domains"
      className="flex gap-1 p-1 bg-muted rounded-lg overflow-x-auto"
      data-testid="domain-tab-bar"
    >
      {DOMAIN_ORDER.map((domain) => {
        const Icon = DOMAIN_ICONS[domain];
        const isActive = active === domain;
        return (
          <button
            key={domain}
            role="tab"
            id={`domain-tab-${domain}`}
            aria-selected={isActive}
            aria-controls="map-panel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(domain)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const idx = DOMAIN_ORDER.indexOf(domain);
                const next = e.key === "ArrowRight"
                  ? DOMAIN_ORDER[(idx + 1) % DOMAIN_ORDER.length]
                  : DOMAIN_ORDER[(idx - 1 + DOMAIN_ORDER.length) % DOMAIN_ORDER.length];
                onChange(next);
                document.getElementById(`domain-tab-${next}`)?.focus();
              }
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
            data-testid={`tab-domain-${domain}`}
          >
            <Icon className={cn("w-4 h-4", isActive && "text-[#1B6EB5]")} />
            {DOMAIN_LABELS[domain]}
          </button>
        );
      })}
    </div>
    </>
  );
}
