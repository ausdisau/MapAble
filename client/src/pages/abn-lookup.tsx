import { Card } from "@/components/ui/card";
import { AbnLookup } from "@/components/abn-lookup";
import { usePageTitle } from "@/hooks/use-page-title";
import { Building2 } from "lucide-react";

export default function AbnLookupPage() {
  usePageTitle("ABN Lookup");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Building2 className="w-6 h-6 text-primary" />
          ABN Lookup
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search the Australian Business Register by ABN to verify business details
        </p>
      </div>

      <Card className="p-5" data-testid="card-abn-lookup">
        <AbnLookup />
      </Card>
    </div>
  );
}
