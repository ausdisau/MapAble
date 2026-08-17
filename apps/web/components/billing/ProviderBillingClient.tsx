"use client";

import { useState } from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export function ProviderBillingClient() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finishOnboarding() {
    setBusy(true);
    const res = await fetch("/api/billing/connect/onboarding-link", {
      method: "POST",
    });
    const data = await res.json();
    if (data.onboardingUrl) {
      window.location.href = data.onboardingUrl;
    } else {
      setMessage(data.error ?? "Could not start onboarding");
    }
    setBusy(false);
  }

  async function startSubscription() {
    setBusy(true);
    const res = await fetch("/api/billing/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode: "provider_pro" }),
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else setMessage(data.error ?? "Subscription checkout unavailable");
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {message && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm" role="status" aria-live="polite">
            {message}
          </CardContent>
        </Card>
      )}

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Stripe Connect payouts</CardTitle>
          <CardDescription>
            Complete onboarding to receive destination charges from participant payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="default" onClick={() => void finishOnboarding()} disabled={busy} size="lg">
            Finish Stripe onboarding
          </Button>
        </CardContent>
      </Card>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Provider Pro <span className="text-secondary">subscription</span>
          </CardTitle>
          <CardDescription>Manage your MapAble provider subscription via Stripe Checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void startSubscription()}
            disabled={busy}
            size="lg"
          >
            Subscribe to Provider Pro
          </Button>
        </CardContent>
      </Card>

      <div className={cn(mapableSectionCardClass, "p-5 sm:p-6")}>
        <h2 className="font-heading text-lg font-semibold">Transactions & transfers</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Payment splits and transfer history appear here after webhook-confirmed payments.
        </p>
      </div>
    </div>
  );
}
