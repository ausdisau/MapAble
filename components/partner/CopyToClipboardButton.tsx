"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CopyToClipboardButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
};

/** Accessible copy-to-clipboard control for partner portal surfaces. */
export function CopyToClipboardButton({
  value,
  label = "Copy to clipboard",
  copiedLabel = "Copied",
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the text and copy manually.");
      setCopied(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={() => void handleCopy()}
        aria-label={copied ? copiedLabel : label}
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? copiedLabel : label}
      </Button>
      <p className="sr-only" aria-live="polite">
        {copied ? "Referral link copied to clipboard." : ""}
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
