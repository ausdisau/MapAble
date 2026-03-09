import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, DollarSign, Clock, Car, Info } from "lucide-react";
import type { PricingTier } from "@shared/schema";

function TierTable({ tiers, unit }: { tiers: PricingTier[]; unit: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-pricing">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-bold">Tier</th>
            <th className="text-left py-3 px-4 font-bold">Usage Range</th>
            <th className="text-left py-3 px-4 font-bold">Rate</th>
            <th className="text-left py-3 px-4 font-bold">NDIS Category</th>
            <th className="text-left py-3 px-4 font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors" data-testid={`row-tier-${tier.tierName.toLowerCase().replace(/\s/g, "-")}`}>
              <td className="py-3 px-4">
                <span className="font-bold">{tier.tierName}</span>
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {tier.maxUsage
                  ? `${tier.minUsage}–${tier.maxUsage} ${unit}`
                  : Number(tier.minUsage) === 0
                  ? "Per service"
                  : `${tier.minUsage}+ ${unit}`}
              </td>
              <td className="py-3 px-4">
                <span className="font-black text-base" style={{ color: "#E6A817" }}>
                  ${Number(tier.rate).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  /{unit === "hrs" ? "hr" : "km"}
                </span>
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px]">
                {tier.ndisCategory}
                {tier.ndisItemCode && (
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {tier.ndisItemCode}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <Badge variant="secondary" className="gap-1 bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 text-[10px]">
                  <ShieldCheck className="w-3 h-3" /> NDIS Compliant
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PricingPage() {
  const { data: careTiers, isLoading: careLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing/care"],
  });

  const { data: transportTiers, isLoading: transportLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing/transport"],
  });

  if (careLoading || transportLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>
        <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">NDIS-Aligned Pricing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transparent, tiered pricing that stays within NDIS price caps. Volume discounts reward consistent usage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="w-10 h-10 rounded-md bg-[#2EAA6E]/15 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-[#2EAA6E]" />
          </div>
          <h3 className="font-bold text-sm mb-1" data-testid="text-feature-ndis-compliant">100% NDIS Compliant</h3>
          <p className="text-xs text-muted-foreground">All rates at or below NDIS price caps</p>
        </Card>
        <Card className="p-5">
          <div className="w-10 h-10 rounded-md bg-[#E6A817]/15 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-[#C48F14] dark:text-[#E6A817]" />
          </div>
          <h3 className="font-bold text-sm mb-1" data-testid="text-feature-volume-discounts">Volume Discounts</h3>
          <p className="text-xs text-muted-foreground">Use more, pay less per unit automatically</p>
        </Card>
        <Card className="p-5">
          <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center mb-3">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-sm mb-1" data-testid="text-feature-no-oop">No Out-of-Pocket</h3>
          <p className="text-xs text-muted-foreground">All costs covered through NDIS funding</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#14578F] via-[#1B6EB5] to-[#2384C9] px-6 py-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5" /> Care Services Pricing
          </h2>
          <p className="text-sm text-white/70 mt-0.5">Hourly rates for daily living and support coordination</p>
        </div>
        <TierTable tiers={careTiers || []} unit="hrs" />
        <div className="px-6 py-4 bg-muted/30 text-xs text-muted-foreground border-t">
          <p>Rates are per hour, GST exempt as per NDIS pricing arrangements. Tier is determined by total monthly hours used.</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#14578F] via-[#1B6EB5] to-[#2384C9] px-6 py-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Car className="w-5 h-5" /> Transport Services Pricing
          </h2>
          <p className="text-sm text-white/70 mt-0.5">Per-kilometre rates for transport assistance</p>
        </div>
        <TierTable tiers={transportTiers || []} unit="km" />
        <div className="px-6 py-4 bg-muted/30 text-xs text-muted-foreground border-t">
          <p>Rates are per kilometre. Accessible Vehicle rate applies to modified/wheelchair-accessible vehicles. Tolls billed at cost.</p>
        </div>
      </Card>
    </div>
  );
}
