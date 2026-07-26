/** MapAble PEERS — community product copy and design principles. */

export const PEERS_TAGLINE =
  "A meeting place built for disability life — not a feed built to keep you scrolling.";

export const PEERS_DESCRIPTION =
  "MapAble PEERS is a modern reinterpretation of disability portals like EnableNet and Disaboom: " +
  "information, debate, and peer support in the open — without additive ranking algorithms " +
  "substituting for genuine community.";

export type PeersPrinciple = {
  id: string;
  title: string;
  body: string;
};

export const PEERS_PRINCIPLES: PeersPrinciple[] = [
  {
    id: "chronology",
    title: "Time, not traction",
    body:
      "Discussions are listed in the order they were started or last honestly updated — " +
      "never re-sorted because an engagement model guessed you would click more.",
  },
  {
    id: "purpose",
    title: "Rooms with a reason",
    body:
      "Topics are grouped around shared needs (access, work, care, advocacy) — not infinite " +
      "condition silos designed mainly to maximise ad inventory.",
  },
  {
    id: "identity",
    title: "Membership, not performance",
    body:
      "You participate as a person with something to contribute — not as content competing " +
      "for visibility in an opaque score.",
  },
  {
    id: "stewardship",
    title: "Hosted community",
    body:
      "Moderation, accessibility defaults, and published rules are part of the product — " +
      "community is maintained, not abandoned to whatever the algorithm promotes.",
  },
  {
    id: "transparency",
    title: "Algorithms elsewhere, declared",
    body:
      "Where MapAble uses automated ranking (search, provider discovery, access maps), it is " +
      "registered publicly. PEERS itself does not use additive feed algorithms.",
  },
];

export type PeersAntiPattern = {
  title: string;
  feed: string;
  peers: string;
};

export const PEERS_CONTRAST: PeersAntiPattern[] = [
  {
    title: "What you see",
    feed: "“Top discussions” and “for you” blends — order changes per viewer.",
    peers: "Room home shows every thread by last activity; same order for everyone signed in.",
  },
  {
    title: "Why it exists",
    feed: "Maximise time-on-site and ad or data value.",
    peers: "Help people find experience, evidence, and solidarity around disability life.",
  },
  {
    title: "Missing voices",
    feed: "Quiet posts disappear; controversial posts get amplified.",
    peers: "Low-activity threads stay findable; heated threads are moderated, not boosted.",
  },
  {
    title: "Legacy lesson",
    feed: "Disaboom (2007–2010) mixed health content with profiles and forums — but still chased scale.",
    peers:
      "EnableNet (1990s–2000s) put information and advocacy first — PEERS inherits that spine with modern accessibility.",
  },
];

export const PEERS_HERITAGE = {
  enableNet:
    "EnableNet (Australia) and similar portals treated the web as a civic meeting place: " +
    "directories, news, forums, and chat in service of disability advocacy.",
  disaboom:
    "Disaboom (United States) showed appetite for condition-based community at national scale — " +
    "but its social-network framing leaned on growth metrics MapAble PEERS explicitly rejects.",
  mapable:
    "PEERS links to MapAble Access for place-based reviews and to platform accountability pages — " +
    "community here is conversational; evidence about venues lives there.",
} as const;
