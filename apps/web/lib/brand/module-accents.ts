/** Brand-aligned module accents — no per-module hex or rainbow gradients. */
export type ModuleAccent = "primary" | "secondary" | "brand";

export const moduleAccentStyles: Record<
  ModuleAccent,
  {
    iconWrapClass: string;
    badgeClass: string;
    linkClass: string;
    cardHoverClass: string;
  }
> = {
  primary: {
    iconWrapClass: "bg-gradient-to-br from-primary/25 to-primary/5",
    badgeClass: "border-transparent bg-primary/10 text-primary",
    linkClass: "text-primary",
    cardHoverClass: "hover:border-primary/25",
  },
  secondary: {
    iconWrapClass: "bg-gradient-to-br from-secondary/25 to-secondary/5",
    badgeClass: "border-transparent bg-secondary/10 text-secondary",
    linkClass: "text-secondary",
    cardHoverClass: "hover:border-secondary/25",
  },
  brand: {
    iconWrapClass: "bg-gradient-to-br from-primary/20 via-muted/30 to-secondary/10",
    badgeClass: "border-transparent bg-primary/10 text-primary",
    linkClass: "text-primary",
    cardHoverClass: "hover:border-primary/20",
  },
};

export function moduleAccentClass(accent: ModuleAccent) {
  return moduleAccentStyles[accent];
}
