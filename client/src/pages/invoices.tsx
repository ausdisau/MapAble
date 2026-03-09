import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, ChevronDown, ChevronUp, Calendar, DollarSign, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Invoice, User } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  submitted: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
  paid: "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300",
};

interface LineItem {
  type: string;
  ndisItemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  subtotal: number;
  date: string;
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const items = (invoice.lineItems as LineItem[]) || [];

  return (
    <Card className="overflow-hidden" data-testid={`card-invoice-${invoice.id}`}>
      <button
        className="w-full px-5 py-4 flex items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        data-testid={`button-toggle-invoice-${invoice.id}`}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm">
              {invoice.periodStart} to {invoice.periodEnd}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {items.length} line item{items.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-black text-lg" data-testid={`text-invoice-total-${invoice.id}`}>
              ${Number(invoice.totalAmount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
            </div>
            {invoice.ndisClaimable && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3 h-3 text-[#2EAA6E]" />
                NDIS claimable: ${Number(invoice.ndisClaimable).toFixed(2)}
              </div>
            )}
          </div>
          <Badge className={statusColors[invoice.status] || ""} data-testid={`badge-invoice-status-${invoice.id}`}>
            {invoice.status}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && items.length > 0 && (
        <div className="border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-2 px-5 text-xs font-bold">Date</th>
                <th className="text-left py-2 px-5 text-xs font-bold">NDIS Code</th>
                <th className="text-left py-2 px-5 text-xs font-bold">Description</th>
                <th className="text-right py-2 px-5 text-xs font-bold">Qty</th>
                <th className="text-right py-2 px-5 text-xs font-bold">Rate</th>
                <th className="text-right py-2 px-5 text-xs font-bold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b last:border-0" data-testid={`row-line-item-${i}`}>
                  <td className="py-2 px-5 text-muted-foreground">{item.date}</td>
                  <td className="py-2 px-5 font-mono text-xs">{item.ndisItemCode}</td>
                  <td className="py-2 px-5">{item.description}</td>
                  <td className="py-2 px-5 text-right">{item.quantity.toFixed(item.type === "transport" ? 1 : 2)}</td>
                  <td className="py-2 px-5 text-right">${item.unitRate.toFixed(2)}</td>
                  <td className="py-2 px-5 text-right font-bold">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });
  const [periodStart, setPeriodStart] = useState("2026-02-01");
  const [periodEnd, setPeriodEnd] = useState("2026-03-31");

  const { data: invoiceList, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", me?.id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?participantId=${me?.id}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!me?.id,
  });

  const generateInvoice = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/invoices/generate", {
        participantId: me?.id,
        periodStart,
        periodEnd,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invoice generated", description: "Your NDIS invoice has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", me?.id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate invoice.", variant: "destructive" });
    },
  });

  if (isLoading || !me) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="p-6"><Skeleton className="h-32 w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and generate NDIS-ready invoices with support item codes
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Generate Invoice
        </h2>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Label htmlFor="period-start" className="text-xs font-semibold">Period Start</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="mt-1"
              data-testid="input-period-start"
            />
          </div>
          <div className="flex-1 w-full">
            <Label htmlFor="period-end" className="text-xs font-semibold">Period End</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="mt-1"
              data-testid="input-period-end"
            />
          </div>
          <Button
            onClick={() => generateInvoice.mutate()}
            disabled={generateInvoice.isPending || !periodStart || !periodEnd}
            className="gap-2 w-full sm:w-auto"
            data-testid="button-generate-invoice"
          >
            <DollarSign className="w-4 h-4" />
            {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {invoiceList && invoiceList.length > 0 ? (
          invoiceList.map((inv) => (
            <InvoiceRow key={inv.id} invoice={inv} />
          ))
        ) : (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No invoices yet. Generate one for a billing period above.
          </Card>
        )}
      </div>
    </div>
  );
}
