"use client";

import { useEffect, useState } from "react";

import type { Provider } from "@/app/provider-finder/providers";

export function usePlatformCareLink(provider: Provider | null | undefined) {
  const [careRequestHref, setCareRequestHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provider) {
      setCareRequestHref(null);
      return;
    }

    const params = new URLSearchParams();
    if (provider.abn) params.set("abn", provider.abn);
    if (provider.slug) params.set("slug", provider.slug);
    if (provider.outletKey) params.set("outletKey", provider.outletKey);
    if (provider.name) params.set("providerName", provider.name);

    let cancelled = false;
    setLoading(true);
    fetch(`/api/care/platform-org?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { link?: { careRequestHref?: string } | null }) => {
        if (cancelled) return;
        setCareRequestHref(data.link?.careRequestHref ?? null);
      })
      .catch(() => {
        if (!cancelled) setCareRequestHref(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    provider?.abn,
    provider?.slug,
    provider?.outletKey,
    provider?.name,
    provider,
  ]);

  return { careRequestHref, loading };
}
