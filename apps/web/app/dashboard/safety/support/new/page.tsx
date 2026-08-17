"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function NewSafetySupportTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("booking_help");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await fetch("/api/support/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, category }),
        });
        setLoading(false);
        if (res.ok) {
          const d = await res.json();
          router.push(`/dashboard/safety/support/${d.ticket.id}`);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not create ticket. Try again.");
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New support ticket</h1>
      <p className="text-sm text-muted-foreground">
        Describe your issue in plain language. A team member will respond. For urgent
        safety risks, call 000; for formal incident reporting use{" "}
        <Link href="/dashboard/safety/incidents/new" className="text-primary underline">
          report a concern
        </Link>
        .
      </p>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <label htmlFor="title" className="font-medium text-sm">
        Title
      </label>
      <input
        id="title"
        className={formInputClass}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <label htmlFor="cat" className="font-medium text-sm">
        Category
      </label>
      <select
        id="cat"
        className={formInputClass}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="booking_help">Booking help</option>
        <option value="transport_issue">Transport issue</option>
        <option value="billing_question">Billing question</option>
        <option value="safeguarding_concern">Safeguarding concern</option>
        <option value="other">Other</option>
      </select>
      <label htmlFor="desc" className="font-medium text-sm">
        Description
      </label>
      <textarea
        id="desc"
        className={formInputClass}
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit ticket
      </Button>
    </form>
  );
}
