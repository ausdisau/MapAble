"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function NewDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        await fetch("/api/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organisationId: fd.get("organisationId"),
            userId: fd.get("userId"),
            displayName: fd.get("displayName"),
          }),
        });
        setLoading(false);
        router.push("/provider/drivers");
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New driver</h1>
      <label htmlFor="organisationId" className="text-sm font-medium">Organisation ID</label>
      <input id="organisationId" name="organisationId" className={formInputClass} required />
      <label htmlFor="userId" className="text-sm font-medium">User ID</label>
      <input id="userId" name="userId" className={formInputClass} required />
      <label htmlFor="displayName" className="text-sm font-medium">Display name</label>
      <input id="displayName" name="displayName" className={formInputClass} required />
      <Button type="submit" variant="default" size="default" loading={loading}>Create</Button>
    </form>
  );
}
