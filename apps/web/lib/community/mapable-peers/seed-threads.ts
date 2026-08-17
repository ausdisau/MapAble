/** Static seed threads — chronological demo content until PEERS persistence ships. */

export type PeersThread = {
  id: string;
  roomSlug: string;
  title: string;
  authorLabel: string;
  /** ISO date — displayed as-is; never re-ranked. */
  lastActivityAt: string;
  replyCount: number;
  excerpt: string;
};

export const PEERS_SEED_THREADS: PeersThread[] = [
  {
    id: "t1",
    roomSlug: "access-and-places",
    title: "Ramp claims vs reality at suburban shopping centres",
    authorLabel: "Sam (wheelchair user, SA)",
    lastActivityAt: "2026-05-20T09:15:00.000Z",
    replyCount: 12,
    excerpt:
      "Happy to compare notes before you travel — photos help but don’t replace lived experience.",
  },
  {
    id: "t2",
    roomSlug: "access-and-places",
    title: "When to use Access reviews vs starting a thread here",
    authorLabel: "MapAble moderator",
    lastActivityAt: "2026-05-18T14:00:00.000Z",
    replyCount: 4,
    excerpt:
      "Reviews are for factual accessibility at a place; PEERS is for discussion and advocacy.",
  },
  {
    id: "t3",
    roomSlug: "work-and-income",
    title: "Plan review meetings that actually reflect fluctuating capacity",
    authorLabel: "Jordan",
    lastActivityAt: "2026-05-22T11:30:00.000Z",
    replyCount: 8,
    excerpt: "Sharing wording that worked when my fatigue weeks weren’t believed.",
  },
  {
    id: "t4",
    roomSlug: "care-and-support",
    title: "Finding reliable respite without burning out the family",
    authorLabel: "Alex (carer)",
    lastActivityAt: "2026-05-19T16:45:00.000Z",
    replyCount: 15,
    excerpt: "Not a referral list — just what questions to ask on the first call.",
  },
  {
    id: "t5",
    roomSlug: "advocacy-and-rights",
    title: "Consultation deadlines this month — what’s worth responding to?",
    authorLabel: "DIRC alumni network",
    lastActivityAt: "2026-05-21T08:00:00.000Z",
    replyCount: 6,
    excerpt: "Linking open submissions; we’ll keep the list chronological, not “trending”.",
  },
  {
    id: "t6",
    roomSlug: "introduce-yourself",
    title: "New here — chronic pain and trying to map accessible GP clinics",
    authorLabel: "Riley",
    lastActivityAt: "2026-05-23T07:20:00.000Z",
    replyCount: 3,
    excerpt: "No pressure to share medical detail; say as much as you’re comfortable with.",
  },
];

export function threadsForRoom(roomSlug: string): PeersThread[] {
  return PEERS_SEED_THREADS.filter((t) => t.roomSlug === roomSlug).sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );
}
