export type ResourceModuleLink = {
  label: string;
  href: string;
  description: string;
  eyebrow: string;
};

export type PolicyResourceLink = {
  label: string;
  href: string;
  description: string;
};

export const resourceModuleLinks: ResourceModuleLink[] = [
  {
    eyebrow: "Care",
    label: "MapAble Care",
    href: "/care",
    description:
      "Consent-first support requests, access-fit matching, and worker capability visibility.",
  },
  {
    eyebrow: "Transport",
    label: "MapAble Transport",
    href: "/transport",
    description:
      "Accessible trip planning, care + transport bundles, and reliability principles.",
  },
  {
    eyebrow: "Access",
    label: "MapAble Access",
    href: "/access",
    description:
      "Participant-controlled access notes, venue profiles, and community access data.",
  },
  {
    eyebrow: "Guides",
    label: "Access Guides",
    href: "/guides",
    description:
      "Capital and regional accessibility guides for Australian cities and towns.",
  },
  {
    eyebrow: "Employment",
    label: "MapAble Employment",
    href: "/employment",
    description:
      "Workplace access context, job support pathways, and rights-aware workflows.",
  },
  {
    eyebrow: "Discovery",
    label: "Provider finder",
    href: "/providers",
    description:
      "Public provider discovery while pilot onboarding and verification are prepared.",
  },
  {
    eyebrow: "Providers",
    label: "For providers",
    href: "/for-providers",
    description:
      "Register interest, review verification approach, and explore provider capabilities.",
  },
  {
    eyebrow: "Support",
    label: "Help centre",
    href: "/help",
    description:
      "Rights Navigator, complaint pathways, and procedural support when something goes wrong.",
  },
  {
    eyebrow: "About",
    label: "About MapAble",
    href: "/about",
    description:
      "Platform principles, roadmap phases, and the Complete Support ecosystem overview.",
  },
];

export const policyResourceLinks: PolicyResourceLink[] = [
  {
    label: "Privacy notice",
    href: "/privacy",
    description: "How MapAble handles personal and access information.",
  },
  {
    label: "Terms of use",
    href: "/terms",
    description: "Conditions for using the public site and pilot features.",
  },
  {
    label: "Data deletion",
    href: "/data-deletion",
    description: "How to request removal of your data from MapAble.",
  },
  {
    label: "Accessibility statement",
    href: "/accessibility-statement",
    description: "Accessibility commitments and known limitations.",
  },
];

export const participantJourneyStepRange = { from: 1, to: 8 };

export const resourceTrustPrincipleTitles = [
  "Consent first",
  "Privacy by design",
  "Accessibility by default",
  "Complaint pathway",
];
