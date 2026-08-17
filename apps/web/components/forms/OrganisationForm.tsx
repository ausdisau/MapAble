"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function OrganisationForm({
  initial,
  organisationId,
}: {
  organisationId?: string;
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [name, setName] = useState((initial?.name as string) ?? "");
  const [organisationType, setOrganisationType] = useState(
    (initial?.organisationType as string) ?? "care_provider"
  );
  const [contactEmail, setContactEmail] = useState(
    (initial?.contactEmail as string) ?? ""
  );
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch(
          organisationId
            ? `/api/organisations/${organisationId}`
            : "/api/organisations",
          {
            method: organisationId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              organisationType,
              contactEmail: contactEmail || null,
            }),
          }
        );
        setLoading(false);
        if (res.ok) {
          const data = await res.json();
          router.push(
            `/admin/organisations/${data.organisation.id}`
          );
        }
      }}
    >
      <AccessibleFormField id="name" label="Organisation name" required>
        <input
          id="name"
          className={formInputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </AccessibleFormField>
      <AccessibleFormField id="type" label="Type" required>
        <select
          id="type"
          className={formInputClass}
          value={organisationType}
          onChange={(e) => setOrganisationType(e.target.value)}
        >
          <option value="care_provider">Care provider</option>
          <option value="transport_provider">Transport provider</option>
          <option value="plan_manager">Plan manager</option>
          <option value="support_coordination">Support coordination</option>
        </select>
      </AccessibleFormField>
      <AccessibleFormField id="email" label="Contact email">
        <input
          id="email"
          type="email"
          className={formInputClass}
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </AccessibleFormField>
      <Button type="submit" variant="default" size="default" loading={loading}>
        Save organisation
      </Button>
    </form>
  );
}
