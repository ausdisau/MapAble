export type LocalAccessPage = {
  slug: string;
  location: string;
  state: string;
  focus: string;
  intro: string;
  featuredPlaceSlugs: string[];
  gaps: string[];
  faqs: { question: string; answer: string }[];
};

export const LOCAL_ACCESS_LOCATIONS: LocalAccessPage[] = [
  {
    slug: "sydney",
    location: "Sydney",
    state: "NSW",
    focus: "accessible places and supports",
    intro:
      "Explore accessible places, provider availability teasers, and transport planning links for Sydney. Confirm critical access needs before you travel — information can change.",
    featuredPlaceSlugs: ["king-street-step-free-cafe", "parramatta-city-library"],
    gaps: [
      "Many inner-west venues still lack measured door widths.",
      "Sensory-friendly hours are inconsistently published.",
    ],
    faqs: [
      {
        question: "Does MapAble certify legal accessibility compliance?",
        answer:
          "No. MapAble provides structured access information and evidence status, not legal certification.",
      },
      {
        question: "Can I plan transport as well as find a place?",
        answer: "Yes. Use the Accessible Journey Planner after checking place access details.",
      },
    ],
  },
  {
    slug: "parramatta",
    location: "Parramatta",
    state: "NSW",
    focus: "wheelchair accessible cafes and civic venues",
    intro:
      "Parramatta pages combine access notes for everyday venues with provider and transport teasers so support coordinators can plan practical outings.",
    featuredPlaceSlugs: ["parramatta-city-library", "king-street-step-free-cafe"],
    gaps: ["Accessible parking notes are sparse for some laneway venues."],
    faqs: [
      {
        question: "Are cafe listings guaranteed step-free?",
        answer:
          "No listing is a guarantee. Check confidence, last checked date, and confirm before travelling.",
      },
    ],
  },
  {
    slug: "newcastle",
    location: "Newcastle",
    state: "NSW",
    focus: "accessible toilets and harbour precinct access",
    intro:
      "Find accessible toilets and nearby supports in Newcastle, with prompts to update missing details through community mapping.",
    featuredPlaceSlugs: ["newcastle-harbour-accessible-toilet"],
    gaps: ["Some foreshore access paths need refreshed measurements after weather events."],
    faqs: [
      {
        question: "How do I add a toilet that is missing?",
        answer: "Use Add Access Info or join a Mapping Day for the suburb.",
      },
    ],
  },
  {
    slug: "wollongong",
    location: "Wollongong",
    state: "NSW",
    focus: "NDIS providers with accessible clinics",
    intro:
      "Wollongong local pages highlight provider access-readiness and clinic access notes alongside community place mapping.",
    featuredPlaceSlugs: [],
    gaps: ["Clinic access profiles are still being collected for many providers."],
    faqs: [
      {
        question: "Where can I check provider availability?",
        answer: "Open the Providers directory and filter by suburb and availability.",
      },
    ],
  },
  {
    slug: "brisbane",
    location: "Brisbane",
    state: "QLD",
    focus: "accessible transport options",
    intro:
      "Use Brisbane local pages to connect place access notes with journey planning placeholders for accessible transport options.",
    featuredPlaceSlugs: [],
    gaps: ["Transport bookability signals are mostly demo labelled for Brisbane right now."],
    faqs: [
      {
        question: "Does MapAble book live vehicles here?",
        answer:
          "Not via live transport APIs on this page. Use Request transport or the journey planner demo flow.",
      },
    ],
  },
  {
    slug: "melbourne",
    location: "Melbourne",
    state: "VIC",
    focus: "sensory-friendly venues",
    intro:
      "Melbourne pages emphasise sensory-friendly venue details, quiet hours, and support coordination for accessible outings.",
    featuredPlaceSlugs: ["southbank-sensory-friendly-gallery"],
    gaps: ["Quiet-hour publication is uneven across private venues."],
    faqs: [
      {
        question: "How current is sensory information?",
        answer: "Check last-checked dates and report updates if a venue changed its quiet hours.",
      },
    ],
  },
];

export function getLocalAccessPage(slug: string): LocalAccessPage | undefined {
  return LOCAL_ACCESS_LOCATIONS.find((page) => page.slug === slug);
}
