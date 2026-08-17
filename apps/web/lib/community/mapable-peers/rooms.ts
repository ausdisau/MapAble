export type PeersRoom = {
  slug: string;
  title: string;
  description: string;
  /** Why this room exists — purpose over engagement bait. */
  purpose: string;
};

export const PEERS_ROOMS: PeersRoom[] = [
  {
    slug: "access-and-places",
    title: "Access & places",
    description: "Discussing venues, transport, and the built environment.",
    purpose:
      "Peer conversation about getting around — complements MapAble Access reviews with open debate.",
  },
  {
    slug: "work-and-income",
    title: "Work & income",
    description: "Employment, NDIS funding, and making ends meet.",
    purpose: "Share tactics and policy context without job-board spam.",
  },
  {
    slug: "care-and-support",
    title: "Care & support",
    description: "Carers, workers, participants, and everyday support life.",
    purpose: "Human-scale help — not influencer caregiving content.",
  },
  {
    slug: "advocacy-and-rights",
    title: "Advocacy & rights",
    description: "Campaigns, consultations, and holding institutions to account.",
    purpose: "Debate and organise — aligned with MapAble civic accountability.",
  },
  {
    slug: "introduce-yourself",
    title: "Introduce yourself",
    description: "Say who you are and what brought you here.",
    purpose: "Low-pressure onboarding — no profile-performance contest.",
  },
];

export function getPeersRoom(slug: string): PeersRoom | undefined {
  return PEERS_ROOMS.find((r) => r.slug === slug);
}
