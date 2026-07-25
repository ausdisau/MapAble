/**
 * Centralised public copy for MapAble Transport `/transport`.
 * Keep claims aligned with `feature-status.ts` and GO-gate safe CTAs.
 */

export const TRANSPORT_PUBLIC_BRAND = "MapAble Transport";

export const TRANSPORT_PUBLIC_HEADLINE =
  "Accessible journeys planned around real needs.";

export const TRANSPORT_PUBLIC_SUPPORTING =
  "Learn how MapAble helps participants, providers, and drivers coordinate accessible travel with privacy-aware records — without over-claiming live national dispatch.";

export const TRANSPORT_PUBLIC_WHO_FOR = [
  {
    id: "participants",
    title: "Participants and supporters",
    summary:
      "Arrange accessible community travel with clear status language and consent-aware records.",
  },
  {
    id: "providers",
    title: "Transport providers",
    summary:
      "Coordinate suitable vehicles and drivers when operator tools and partner integrations are enabled.",
  },
  {
    id: "drivers",
    title: "Drivers",
    summary:
      "Receive need-to-know trip instructions for assigned journeys — not unrestricted personal data.",
  },
] as const;

/** Participant-facing trip language from PRODUCT_REQUIREMENTS (public explainer). */
export const TRANSPORT_PUBLIC_TRIP_STEPS = [
  {
    id: "requested",
    title: "Requested",
    summary: "A trip request is submitted. This is not yet a confirmed booking.",
  },
  {
    id: "quoting",
    title: "Quoting",
    summary:
      "A price or window may be offered. Quotes are not confirmed until accepted.",
  },
  {
    id: "confirmed",
    title: "Confirmed",
    summary: "The participant accepts a quote. Fulfilment can begin.",
  },
  {
    id: "assigned",
    title: "Assigned",
    summary:
      "An eligible driver and suitable vehicle are attached. Assigned is not en route.",
  },
  {
    id: "in-progress",
    title: "In progress",
    summary: "Active delivery states from pickup through drop-off.",
  },
  {
    id: "completed",
    title: "Completed",
    summary: "Service record closed for operations; review or dispute paths may follow.",
  },
] as const;

export const TRANSPORT_PUBLIC_SAFETY = {
  heading: "Safety and privacy",
  points: [
    "Exact pickup and drop-off details stay restricted to authorised people.",
    "Route estimates are advisory until an operator confirms a window.",
    "MapAble is not an emergency service. If you are in immediate danger, call 000.",
  ],
} as const;

/** GO-gate safe CTAs — do not lead with excluded transactional paths. */
export const TRANSPORT_PUBLIC_CTAS = {
  primary: {
    label: "Find transport providers",
    href: "/provider-finder?area=Transport",
  },
  secondary: {
    label: "Contact MapAble",
    href: "/contact",
  },
  tertiary: {
    label: "Signed-in participants can request a trip",
    href: "/transport/request",
  },
} as const;

export const TRANSPORT_PUBLIC_NEXT_LINKS = [
  { label: "MapAble Care", href: "/care" },
  { label: "Accessible places", href: "/accessibility-map" },
  { label: "Provider directory", href: "/providers" },
] as const;
