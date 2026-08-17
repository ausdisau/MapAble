import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { validateAbn, formatAbn, stripAbn } from "@shared/abn-utils";
import type { AbnLookupResult } from "@shared/abn-utils";
import {
  Search,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  Heart,
  Briefcase,
  Info,
} from "lucide-react";

interface AbnLookupProps {
  onResult?: (result: AbnLookupResult) => void;
  initialAbn?: string;
  compact?: boolean;
}

export function AbnLookup({ onResult, initialAbn, compact }: AbnLookupProps) {
  const [abnInput, setAbnInput] = useState(initialAbn || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<AbnLookupResult | null>(null);
  const { toast } = useToast();

  const lookupMutation = useMutation({
    mutationFn: async (abn: string) => {
      const res = await apiRequest("POST", "/api/abn/lookup", { abn });
      return res.json() as Promise<AbnLookupResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      onResult?.(data);
    },
    onError: (err: Error) => {
      setResult(null);
      toast({
        title: "ABN Lookup Failed",
        description: err.message.replace(/^\d+:\s*/, "").replace(/^"(.*)"$/, "$1"),
        variant: "destructive",
      });
    },
  });

  const handleBlur = () => {
    const stripped = stripAbn(abnInput);
    if (stripped.length === 11) {
      setAbnInput(formatAbn(stripped));
    }
    if (stripped.length > 0) {
      const validation = validateAbn(stripped);
      setValidationError(validation.valid ? null : validation.error || null);
    }
  };

  const handleLookup = () => {
    const validation = validateAbn(abnInput);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid ABN");
      return;
    }
    setValidationError(null);
    lookupMutation.mutate(stripAbn(abnInput));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLookup();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="abn-input">Australian Business Number (ABN)</Label>
        <div className="flex gap-2">
          <Input
            id="abn-input"
            placeholder="XX XXX XXX XXX"
            value={abnInput}
            onChange={(e) => {
              setAbnInput(e.target.value);
              if (validationError) setValidationError(null);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={validationError ? "border-destructive" : ""}
            data-testid="input-abn"
          />
          <Button
            onClick={handleLookup}
            disabled={lookupMutation.isPending || !abnInput.trim()}
            data-testid="button-abn-lookup"
          >
            {lookupMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span className="ml-1.5">Lookup</span>
          </Button>
        </div>
        {validationError && (
          <p className="text-sm text-destructive flex items-center gap-1.5" data-testid="text-abn-error">
            <AlertCircle className="w-3.5 h-3.5" />
            {validationError}
          </p>
        )}
      </div>

      {result && <AbnResultCard result={result} compact={compact} />}
    </div>
  );
}

export function AbnResultCard({ result, compact }: { result: AbnLookupResult; compact?: boolean }) {
  const isActive = result.abnStatus === "Active";
  const isFormatOnly = result.abnStatus === "Valid (format only)";
  const isOffline = result.offline;

  return (
    <Card className="overflow-hidden" data-testid="card-abn-result">
      <div className={`px-4 py-3 flex items-center justify-between ${isActive ? "bg-[#2EAA6E]/10 dark:bg-[#2EAA6E]/20" : isFormatOnly ? "bg-muted/50" : "bg-destructive/10"}`}>
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 className="w-5 h-5 text-[#2EAA6E]" />
          ) : isFormatOnly ? (
            <Info className="w-5 h-5 text-muted-foreground" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive" />
          )}
          <span className="font-semibold text-sm">
            ABN: {result.abnFormatted}
          </span>
        </div>
        <Badge variant={isActive ? "default" : isFormatOnly ? "secondary" : "destructive"} className={isActive ? "bg-[#2EAA6E]" : ""} data-testid="badge-abn-status">
          {result.abnStatus}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        {isOffline && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>ABR API key not configured. Showing format validation only. Set ABR_GUID environment variable for full lookup.</span>
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Entity Name</p>
            <p className="text-sm font-medium" data-testid="text-entity-name">{result.entityName || "—"}</p>
          </div>
        </div>

        {result.businessNames.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Business Name(s)</p>
              {result.businessNames.map((name, i) => (
                <p key={i} className="text-sm" data-testid={`text-business-name-${i}`}>{name}</p>
              ))}
            </div>
          </div>
        )}

        {result.tradingNames.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Trading Name(s)</p>
              {result.tradingNames.map((name, i) => (
                <p key={i} className="text-sm" data-testid={`text-trading-name-${i}`}>{name}</p>
              ))}
            </div>
          </div>
        )}

        {!compact && (
          <>
            {result.entityTypeDescription && (
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Entity Type</p>
                  <p className="text-sm" data-testid="text-entity-type">{result.entityTypeDescription}</p>
                </div>
              </div>
            )}

            {(result.state || result.postcode) && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm" data-testid="text-abn-location">
                    {[result.state, result.postcode].filter(Boolean).join(" ")}
                  </p>
                </div>
              </div>
            )}

            {result.abnStatusEffectiveFrom && (
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Status Effective From</p>
                  <p className="text-sm" data-testid="text-abn-status-from">{result.abnStatusEffectiveFrom}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">GST:</span>
                <Badge variant={result.gstRegistered ? "default" : "secondary"} className={`text-[10px] ${result.gstRegistered ? "bg-[#2EAA6E]" : ""}`} data-testid="badge-gst-status">
                  {result.gstRegistered ? `Registered${result.gstRegisteredFrom ? ` from ${result.gstRegisteredFrom}` : ""}` : "Not Registered"}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">DGR:</span>
                <Badge variant={result.dgrEndorsed ? "default" : "secondary"} className={`text-[10px] ${result.dgrEndorsed ? "bg-[#2EAA6E]" : ""}`} data-testid="badge-dgr-status">
                  {result.dgrEndorsed ? "Endorsed" : "Not Endorsed"}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
