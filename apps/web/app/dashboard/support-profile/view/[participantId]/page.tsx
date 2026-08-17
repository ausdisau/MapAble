"use client";

import { useEffect, useState } from "react";

import { ConsentSharingPanel } from "@/components/consent/ConsentSharingPanel";

export default function CoordinatorSupportProfileView({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    version: number;
    sections: {
      routinesJson: { label: string; detail: string }[];
    };
  } | null>(null);
  const [consentGranted, setConsentGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setParticipantId(p.participantId));
  }, [params]);

  useEffect(() => {
    if (!participantId || !consentGranted) return;
    void fetch(`/api/support-profile/${participantId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load profile");
        }
        return res.json();
      })
      .then((data) => setProfile(data.profile))
      .catch((e: Error) => setError(e.message));
  }, [participantId, consentGranted]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Participant support profile</h1>
      {!consentGranted ? (
        <ConsentSharingPanel
          scope="support_coordination.access"
          purpose="View published routines, preferences, and boundaries to coordinate support."
          recipientLabel="You, as support coordinator"
          notSharedNotes={["Draft sections not yet published", "Unrelated medical records"]}
          onGranted={() => setConsentGranted(true)}
        />
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {profile ? (
        <p className="text-sm">
          Published version {profile.version} — {profile.sections.routinesJson.length}{" "}
          routine item(s) on file.
        </p>
      ) : null}
    </div>
  );
}
