"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

type SectionItem = { label: string; detail: string };

export default function EditSupportProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routines, setRoutines] = useState<SectionItem[]>([]);
  const [preferences, setPreferences] = useState<SectionItem[]>([]);
  const [boundaries, setBoundaries] = useState<SectionItem[]>([]);
  const [escalation, setEscalation] = useState({
    primaryContact: "",
    whenToEscalate: "",
    emergencyInstructions: "",
  });

  useEffect(() => {
    void fetch("/api/support-profile")
      .then((res) => res.json())
      .then((data) => {
        const sections = data.profile?.sections;
        if (sections) {
          setRoutines(sections.routinesJson ?? []);
          setPreferences(sections.preferencesJson ?? []);
          setBoundaries(sections.boundariesJson ?? []);
          setEscalation({
            primaryContact: sections.escalationJson?.primaryContact ?? "",
            whenToEscalate: sections.escalationJson?.whenToEscalate ?? "",
            emergencyInstructions:
              sections.escalationJson?.emergencyInstructions ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(publish: boolean) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/support-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routinesJson: routines,
        preferencesJson: preferences,
        boundariesJson: boundaries,
        escalationJson: escalation,
        publish,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      setSaving(false);
      return;
    }
    router.push("/dashboard/support-profile");
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold">Edit support profile</h1>
      <p className="text-sm text-muted-foreground">
        Use plain language. Only include what workers need to support you well.
      </p>

      <SectionEditor title="Routines" items={routines} onChange={setRoutines} />
      <SectionEditor
        title="Preferences"
        items={preferences}
        onChange={setPreferences}
      />
      <SectionEditor
        title="Boundaries"
        items={boundaries}
        onChange={setBoundaries}
      />

      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">Escalation</legend>
        <label className="block text-sm">
          Primary contact
          <input
            className={formInputClass}
            value={escalation.primaryContact}
            onChange={(e) =>
              setEscalation({ ...escalation, primaryContact: e.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          When to escalate
          <textarea
            className={formInputClass}
            rows={3}
            value={escalation.whenToEscalate}
            onChange={(e) =>
              setEscalation({ ...escalation, whenToEscalate: e.target.value })
            }
          />
        </label>
        <label className="block text-sm">
          Emergency instructions
          <textarea
            className={formInputClass}
            rows={3}
            value={escalation.emergencyInstructions}
            onChange={(e) =>
              setEscalation({
                ...escalation,
                emergencyInstructions: e.target.value,
              })
            }
          />
        </label>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={saving}
          onClick={() => void save(false)}
        >
          Save draft
        </Button>
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={saving}
          onClick={() => void save(true)}
        >
          Publish profile
        </Button>
      </div>
    </div>
  );
}

function SectionEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {items.map((item, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-2">
          <input
            className={formInputClass}
            placeholder="Label"
            value={item.label}
            onChange={(e) => {
              const next = [...items];
              next[index] = { ...item, label: e.target.value };
              onChange(next);
            }}
          />
          <input
            className={formInputClass}
            placeholder="Detail"
            value={item.detail}
            onChange={(e) => {
              const next = [...items];
              next[index] = { ...item, detail: e.target.value };
              onChange(next);
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { label: "", detail: "" }])}
      >
        Add {title.toLowerCase()} item
      </Button>
    </fieldset>
  );
}
