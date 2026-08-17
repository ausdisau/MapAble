/** Canonical palette from the combined-care homepage — single source of truth. */
export const mapableCareColors = {
  navy: "#0C1833",
  brandBlue: "#005B7F",
  brandBlueDark: "#004766",
  brandYellow: "#F8C51C",
  brandGreen: "#00A979",
  surface: "#F6FBFC",
  white: "#FFFFFF",
} as const;

/**
 * WCAG 2.2 focus appearance: ≥2px ring + offset, high-contrast primary.
 * Prefer focus-visible so mouse users are not interrupted.
 */
export const mapableInteractiveFocusRing =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary";

/** Brand-forward focus for marketing CTAs (yellow ring, same thickness/offset). */
export const mapableCareFocusRing =
  "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F8C51C] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F8C51C]";

export const mapableCareFocusRingSubtle =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F8C51C]/80";

export const mapableCareBodyClass = "mapable-soft text-[#0C1833]";

export const mapableCarePageBgClass = "bg-white";

export const mapableCareCtaClass =
  "rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary";

export const mapableCareOutlineCtaClass =
  "rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary";

export const mapableCareCardClass =
  "rounded-2xl border border-slate-200 bg-[#F6FBFC]";

export const mapableCareEyebrowClass =
  "inline-flex w-fit rounded-full border border-[#005B7F]/20 bg-[#005B7F]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#005B7F]";
