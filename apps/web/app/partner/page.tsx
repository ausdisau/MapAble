import {
  Download,
  KeyRound,
  Layers3,
  LineChart,
  Link2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Placeholder KPI metrics for the Partner Portal dashboard.
 * TODO: replace with server fetches from Partner API usage, embed registry,
 * accessibility report exports, and referral ledger services.
 */
const KPI_CARDS = [
  {
    title: "API Requests (This Month)",
    value: "128,450",
    hint: "Across all live API keys",
    icon: LineChart,
  },
  {
    title: "Active Embed Widgets",
    value: "14",
    hint: "3D wayfinding iframes in production",
    icon: Layers3,
  },
  {
    title: "Accessibility Reports Generated",
    value: "62",
    hint: "Quarter-to-date compliance packs",
    icon: Sparkles,
  },
  {
    title: "Referral Credits Earned",
    value: "$4,800",
    hint: "Pending settlement this quarter",
    icon: Link2,
  },
] as const;

const QUICK_ACTIONS = [
  {
    href: "/partner/developer",
    label: "Generate New API Key",
    description: "Create a scoped key for your integration",
    icon: KeyRound,
  },
  {
    href: "/partner/analytics",
    label: "Download Quarterly Report",
    description: "Export accessibility impact for compliance",
    icon: Download,
  },
  {
    href: "/partner/referrals",
    label: "Share Referral Link",
    description: "Invite organisations and earn credits",
    icon: Link2,
  },
] as const;

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-bold">Dashboard</h2>
        <p className="max-w-2xl text-muted-foreground">
          Overview of your organisation&apos;s MapAble Partner Program activity —
          API usage, embeds, accessibility reporting, and referral incentives.
        </p>
      </header>

      <section aria-labelledby="partner-kpis-heading">
        <h3 id="partner-kpis-heading" className="sr-only">
          Key performance indicators
        </h3>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <li key={kpi.title}>
                <Card variant="default" className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {kpi.title}
                      </CardTitle>
                      <Icon
                        className="h-4 w-4 text-[#005B7F]"
                        aria-hidden="true"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold tracking-tight">
                      {kpi.value}
                    </p>
                    <CardDescription className="mt-1">
                      {kpi.hint}
                    </CardDescription>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="partner-quick-actions-heading" className="space-y-4">
        <div>
          <h3
            id="partner-quick-actions-heading"
            className="text-lg font-semibold"
          >
            Quick Actions
          </h3>
          <p className="text-sm text-muted-foreground">
            Common partner tasks. Actions route to the relevant portal section
            until dedicated server actions are wired.
          </p>
        </div>

        <ul className="grid gap-3 md:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Card variant="interactive" className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {action.label}
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="default" size="default">
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
