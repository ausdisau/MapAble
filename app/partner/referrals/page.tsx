import { CopyToClipboardButton } from "@/components/partner/CopyToClipboardButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";

/**
 * Placeholder referral tracking rows.
 * TODO: load from partner referral ledger / CRM sync scoped to the partner org.
 */
const REFERRAL_ROWS = [
  {
    id: "ref_1",
    organisation: "Harbour Transit Co-op",
    status: "Onboarding",
    incentive: "$500 credit",
    referredAt: "2026-07-10",
  },
  {
    id: "ref_2",
    organisation: "Civic Access Alliance",
    status: "Active",
    incentive: "$1,200 credit",
    referredAt: "2026-06-02",
  },
  {
    id: "ref_3",
    organisation: "Regional Advocacy Network",
    status: "Invited",
    incentive: "Pending",
    referredAt: "2026-07-20",
  },
] as const;

export default async function PartnerReferralsPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);

  // Stable scaffold code until partners receive issued referral codes.
  const referralCode = orgIds[0]
    ? `partner_${orgIds[0].slice(0, 8)}`
    : "partner_123";
  const referralLink = `https://mapable.com.au/join?ref=${referralCode}`;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-bold">Referrals</h2>
        <p className="max-w-2xl text-muted-foreground">
          Share your unique link to onboard organisations into MapAble and track
          incentive credits earned for successful referrals.
        </p>
      </header>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
          <CardDescription>
            Anyone who joins via this link is attributed to your partner account.
            {/* TODO: issue codes via POST /api/partner/referrals/link */}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Referral URL
            </p>
            <p className="mt-1 break-all font-mono text-sm" id="partner-referral-link">
              {referralLink}
            </p>
          </div>
          <CopyToClipboardButton
            value={referralLink}
            label="Copy to clipboard"
            copiedLabel="Link copied"
          />
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Referral tracking</CardTitle>
          <CardDescription>
            Referred organisations, onboarding status, and credits awarded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Partner referral tracking table
              </caption>
              <thead className="border-b border-border/60 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Organisation
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Onboarding status
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Incentive / credit
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Referred
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {REFERRAL_ROWS.map((row) => (
                  <tr key={row.id}>
                    <th
                      scope="row"
                      className="px-3 py-3 font-medium text-foreground"
                    >
                      {row.organisation}
                    </th>
                    <td className="px-3 py-3">{row.status}</td>
                    <td className="px-3 py-3">{row.incentive}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <time dateTime={row.referredAt}>{row.referredAt}</time>
                    </td>
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
