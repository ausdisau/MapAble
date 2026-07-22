"use client";

import { SessionProvider } from "next-auth/react";

import { BrandProvider } from "@/app/contexts/BrandContext";
import { AccessibilityPreferencesProvider } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { isFirstPartyAccessibilityPanelEnabled } from "@/lib/accessibility/feature-flags";
import { QueryProvider } from "@/lib/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const content = isFirstPartyAccessibilityPanelEnabled() ? (
    <AccessibilityPreferencesProvider>
      {children}
    </AccessibilityPreferencesProvider>
  ) : (
    children
  );

  return (
    <SessionProvider>
      <QueryProvider>
        <BrandProvider>{content}</BrandProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
