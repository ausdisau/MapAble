"use client";

import { Button } from "@/components/ui/button";

export function TelehealthJoinButton({
  joinUrl,
  disabled,
}: {
  joinUrl: string;
  disabled?: boolean;
}) {
  return (
    <Button variant="default" size="default" disabled={disabled} asChild>
      <a href={joinUrl} target="_blank" rel="noopener noreferrer">
        Join video session
      </a>
    </Button>
  );
}
