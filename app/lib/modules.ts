// Note: You'll need to provide your own module icons/images
// This is a simplified version - replace image imports with your actual assets

import type { ModuleAccent } from "@/lib/brand/module-accents";

export type IconStyle = "organic" | "3d";

export interface ModuleIcons {
  organic: string;
  "3d": string;
}

export interface MapAbleModule {
  key: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  logo: string;
  icons: ModuleIcons;
  accent: ModuleAccent;
  href: string;
  features: string[];
}

// Placeholder - replace with your actual module icons
export const moduleIcons: Record<string, ModuleIcons> = {
  main: { organic: "/icons/main-organic.png", "3d": "/icons/main-3d.png" },
  care: { organic: "/icons/care-organic.png", "3d": "/icons/care-3d.png" },
  transport: {
    organic: "/icons/transport-organic.png",
    "3d": "/icons/transport-3d.png",
  },
  jobs: { organic: "/icons/jobs-organic.png", "3d": "/icons/jobs-3d.png" },
  foods: { organic: "/icons/foods-organic.png", "3d": "/icons/foods-3d.png" },
  moves: { organic: "/icons/moves-organic.png", "3d": "/icons/moves-3d.png" },
  marketplace: {
    organic: "/icons/marketplace-organic.png",
    "3d": "/icons/marketplace-3d.png",
  },
  kids: { organic: "/icons/kids-organic.png", "3d": "/icons/kids-3d.png" },
};

export function getModuleIcon(
  moduleKey: string,
  style: IconStyle = "organic"
): string {
  return moduleIcons[moduleKey]?.[style] || moduleIcons.main[style];
}

/** Year-One registry: Core, Care, Transport, Jobs only. */
export const YEAR_ONE_MODULE_KEYS = ["care", "transport", "jobs"] as const;

/** Deferred verticals — kept for icon/metadata lookups; excluded from `modules`. */
export const deferredModules: MapAbleModule[] = [
  {
    key: "foods",
    name: "MapAble Foods",
    shortName: "Foods",
    tagline: "Nourishing Lives",
    description:
      "Access meal delivery and nutrition services tailored to your needs",
    logo: moduleIcons.foods.organic,
    icons: moduleIcons.foods,
    accent: "secondary",
    href: "/foods",
    features: [
      "Meal Delivery",
      "Dietary Plans",
      "Nutrition Support",
      "Special Diets",
    ],
  },
  {
    key: "moves",
    name: "MapAble Moves",
    shortName: "Moves",
    tagline: "Move Better, Live Better",
    description:
      "Access physical therapy and rehabilitation services to improve mobility and wellbeing",
    logo: moduleIcons.moves.organic,
    icons: moduleIcons.moves,
    accent: "primary",
    href: "/moves",
    features: [
      "Physical Therapy",
      "Rehabilitation",
      "Exercise Programs",
      "Mobility Training",
    ],
  },
  {
    key: "marketplace",
    name: "MapAble Marketplace",
    shortName: "Marketplace",
    tagline: "Shop with Ease",
    description:
      "Browse and purchase disability aids, equipment, and daily essentials",
    logo: moduleIcons.marketplace.organic,
    icons: moduleIcons.marketplace,
    accent: "brand",
    href: "/marketplace",
    features: [
      "Mobility Aids",
      "Daily Living",
      "Sensory Products",
      "NDIS Approved",
    ],
  },
  {
    key: "kids",
    name: "MapAble Kids",
    shortName: "Kids",
    tagline: "Growing Together",
    description:
      "Specialized services and support for children with disabilities",
    logo: moduleIcons.kids.organic,
    icons: moduleIcons.kids,
    accent: "secondary",
    href: "/kids",
    features: [
      "Early Intervention",
      "Therapy Services",
      "School Support",
      "Family Programs",
    ],
  },
];

export const modules: MapAbleModule[] = [
  {
    key: "care",
    name: "MapAble Care",
    shortName: "Care",
    tagline: "Compassionate Support",
    description:
      "Find and book qualified support workers for personalized care services",
    logo: moduleIcons.care.organic,
    icons: moduleIcons.care,
    accent: "primary",
    href: "/care",
    features: ["Support Workers", "Care Plans", "Case Notes", "NDIS Funding"],
  },
  {
    key: "transport",
    name: "MapAble Transport",
    shortName: "Transport",
    tagline: "Accessible Journeys",
    description: "Book accessible vehicles and rides for your travel needs",
    logo: moduleIcons.transport.organic,
    icons: moduleIcons.transport,
    accent: "secondary",
    href: "/transport",
    features: [
      "Wheelchair Access",
      "Door-to-Door",
      "Group Transport",
      "Medical Trips",
    ],
  },
  {
    key: "jobs",
    name: "MapAble Jobs",
    shortName: "Jobs",
    tagline: "Inclusive Employment",
    description:
      "Discover employment opportunities with disability-friendly employers",
    logo: moduleIcons.jobs.organic,
    icons: moduleIcons.jobs,
    accent: "brand",
    href: "/dashboard/jobs",
    features: [
      "Job Matching",
      "Employer Network",
      "Skills Training",
      "Workplace Support",
    ],
  },
];

export const mainModule = {
  key: "main",
  name: "MapAble",
  shortName: "MapAble",
  tagline: "Empowering Independence",
  description: "Your complete NDIS disability services ecosystem",
  logo: moduleIcons.main.organic,
  icons: moduleIcons.main,
  accent: "brand" as ModuleAccent,
};

export function getModuleByKey(key: string): MapAbleModule | undefined {
  return (
    modules.find((m) => m.key === key) ??
    deferredModules.find((m) => m.key === key)
  );
}
