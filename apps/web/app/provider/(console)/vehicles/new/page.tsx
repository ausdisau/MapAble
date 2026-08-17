"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organisationId: fd.get("organisationId"),
            displayName: fd.get("displayName"),
            vehicleType: fd.get("vehicleType"),
            wheelchairAccessible: fd.get("wheelchair") === "on",
          }),
        });
        setLoading(false);
        if (res.ok) router.push("/provider/vehicles");
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New vehicle</h1>
      <label htmlFor="organisationId" className="text-sm font-medium">Organisation ID</label>
      <input id="organisationId" name="organisationId" className={formInputClass} required />
      <label htmlFor="displayName" className="text-sm font-medium">Display name</label>
      <input id="displayName" name="displayName" className={formInputClass} required />
      <label htmlFor="vehicleType" className="text-sm font-medium">Type</label>
      <select id="vehicleType" name="vehicleType" className={formInputClass}>
        <option value="accessible_van">Accessible van</option>
        <option value="standard_car">Standard car</option>
      </select>
      <label className="flex gap-2">
        <input type="checkbox" name="wheelchair" /> Wheelchair accessible
      </label>
      <Button type="submit" variant="default" size="default" loading={loading}>Create</Button>
    </form>
  );
}
