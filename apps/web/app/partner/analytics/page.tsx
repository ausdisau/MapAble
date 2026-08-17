import { DownloadReportButton } from "@/components/partner/DownloadReportButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Mock accessibility insights for transit agencies / city councils.
 * TODO: fetch from partner analytics warehouse scoped to the partner's venues.
 */
const RECENT_INSIGHTS = [
  {
    id: "ins_1",
    title: "Elevator Outage at Central Station",
    category: "Vertical access",
    infrastructure: "Central Station — Lift B",
    reportedAt: "2026-07-24T09:15:00+10:00",
    impact: "High",
  },
  {
    id: "ins_2",
    title: "New Ramps Audited — Harbour Precinct",
    category: "Audit complete",
    infrastructure: "Harbour Precinct entries 1–4",
    reportedAt: "2026-07-22T14:40:00+10:00",
    impact: "Positive",
  },
  {
    id: "ins_3",
    title: "Tactile paving gap near Platform 3",
    category: "Wayfinding",
    infrastructure: "Town Hall Station — Platform 3",
    reportedAt: "2026-07-21T11:05:00+10:00",
    impact: "Medium",
  },
  {
    id: "ins_4",
    title: "Accessible toilet reported closed",
    category: "Amenities",
    infrastructure: "Civic Centre Level G",
    reportedAt: "2026-07-19T16:20:00+10:00",
    impact: "High",
  },
] as const;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  }).format(new Date(iso));
}

export default function PartnerAnalyticsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold">Analytics &amp; Data</h2>
          <p className="max-w-2xl text-muted-foreground">
            Accessibility impact for your infrastructure — outages, audits, and
            community reports mapped to stations, venues, and civic assets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Export reports">
          <DownloadReportButton format="csv" />
          <DownloadReportButton format="pdf" />
        </div>
      </header>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Recent Accessibility Insights</CardTitle>
          <CardDescription>
            Placeholder feed for partner compliance tracking. Replace with live
            insights from the partner analytics API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Recent accessibility insights for partner infrastructure
              </caption>
              <thead className="border-b border-border/60 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Insight
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Infrastructure
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Reported
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {RECENT_INSIGHTS.map((insight) => (
                  <tr key={insight.id}>
                    <th
                      scope="row"
                      className="px-3 py-3 font-medium text-foreground"
                    >
                      {insight.title}
                    </th>
                    <td className="px-3 py-3 text-muted-foreground">
                      {insight.category}
                    </td>
                    <td className="px-3 py-3">{insight.infrastructure}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <time dateTime={insight.reportedAt}>
                        {formatDate(insight.reportedAt)}
                      </time>
                    </td>
                    <td className="px-3 py-3">{insight.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
