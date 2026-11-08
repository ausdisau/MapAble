import { notFound } from "next/navigation";

import { MapAbleDayPreview } from "@/components/day/MapAbleDayPreview";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "MapAble Day — Care and Support Planner | MapAble",
};

export const dynamic = "force-dynamic";

/**
 * Explicit opt-in demo gate. This page has no data-fetching or write
 * capability unless the separately gated calendar read is enabled.
 * Neither mode replaces existing Calendar, CareOS, or Care routes.
 */
export default async function MapAbleDayPage() {
  await requireAuth();
  if (process.env.MAPABLE_DAY_DEMO_ENABLED !== "true") notFound();

  return (
    <MapAbleDayPreview
      calendarReadEnabled={process.env.MAPABLE_DAY_READ_CALENDAR_ENABLED === "true"}
    />
  );
}
