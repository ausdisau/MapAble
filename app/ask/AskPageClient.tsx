"use client";

import { useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

import { CopilotPanel } from "@/components/copilot/CopilotPanel";

type Props = {
  modelLabel?: string;
};

export function AskPageClient({ modelLabel }: Props) {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => {
    const q = searchParams.get("q")?.trim();
    if (q) return q;

    const provider = searchParams.get("provider")?.trim();
    if (!provider) return undefined;
    const name = provider.replace(/-/g, " ");
    return `Tell me about ${name} and what supports they offer`;
  }, [searchParams]);

  return <CopilotPanel initialQuery={initialQuery} modelLabel={modelLabel} />;
}
