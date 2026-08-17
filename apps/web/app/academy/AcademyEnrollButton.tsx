"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AcademyEnrollButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function enroll() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/academy/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enroll failed");
      setMessage(`Enrolled in ${courseTitle}`);
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={enroll}>
        {loading ? "Enrolling…" : "Enroll"}
      </Button>
      {message ? <p className="mt-1 text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
