import { Loader2, Send } from "lucide-react";
import React from "react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isBusy?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

export function GuidedSearchComposer({
  inputId,
  value,
  onChange,
  onSubmit,
  disabled = false,
  isBusy = false,
  placeholder = "Describe what you need…",
  compact = false,
  className,
}: Props) {
  return (
    <form
      className={cn("flex gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        Message MapAble
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || isBusy}
        autoComplete="off"
        className={cn(
          "min-w-0 flex-1 rounded-lg border border-input bg-background shadow-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          compact
            ? "min-h-9 px-3 text-xs"
            : "min-h-10 px-3 text-sm",
        )}
      />
      <Button
        type="submit"
        variant="default"
        size={compact ? "sm" : "default"}
        disabled={disabled || isBusy || !value.trim()}
        className={compact ? "h-9 px-3" : undefined}
      >
        {isBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
