import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/** Shared Tailwind class groups aligned with combined-care homepage */
export const mapableHeaderClass =
  "sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90";

export const mapableRoleNavBarClass = "border-b border-slate-200 bg-white";

export const mapableNavLinkClass = cn(
  "rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-[#F6FBFC] hover:text-[#005B7F]",
  mapableCareFocusRing,
);

export const mapableNavLinkActiveClass =
  "rounded-xl px-3 py-2 text-sm font-black bg-[#005B7F]/10 text-[#005B7F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40";

export const mapablePageContainerClass = "container mx-auto px-4";

export const mapableSectionCardClass =
  "rounded-2xl border border-slate-200 bg-[#F6FBFC] shadow-sm";

export const mapableEyebrowBadgeClass =
  "border-[#005B7F]/20 bg-[#005B7F]/10 font-black text-[#005B7F] shadow-sm rounded-full";

export const mapableEyebrowBadgeSecondaryClass =
  "border-[#00A979]/20 bg-[#00A979]/10 text-[#00A979] rounded-full";

/** Accessible search inputs — stronger placeholder contrast than default muted. */
export const mapableSearchInputClass =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pr-3 text-base text-[#0C1833] shadow-sm outline-none transition placeholder:text-slate-500 focus-visible:border-[#005B7F]/40 focus-visible:ring-4 focus-visible:ring-[#F8C51C]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const mapableSearchFieldSecondaryClass =
  "rounded-xl border border-dashed border-slate-200 bg-[#F6FBFC] p-3 sm:p-4";
