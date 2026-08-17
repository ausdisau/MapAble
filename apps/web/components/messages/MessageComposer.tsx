"use client";

import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function MessageComposer({
  onSend,
  onTyping,
  disabled,
}: {
  onSend: (body: string) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
}) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-2 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");
        try {
          await onSend(body);
          setBody("");
          setStatus("Message sent.");
        } catch {
          setStatus("Could not send message. Try again.");
        }
        setLoading(false);
      }}
    >
      <label htmlFor="message-body" className="font-medium text-sm">
        Your message
      </label>
      <textarea
        id="message-body"
        className={formInputClass}
        rows={4}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          onTyping?.();
        }}
        disabled={disabled}
        required
        maxLength={10000}
      />
      <p className="text-xs text-muted-foreground">
        Only people in this conversation can see your message.
      </p>
      {status ? (
        <p role="status" className="text-sm">
          {status}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="default"
        size="default"
        loading={loading || disabled}
        disabled={disabled}
      >
        Send message
      </Button>
    </form>
  );
}
