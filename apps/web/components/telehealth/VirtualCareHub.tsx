"use client";

import { useEffect, useState } from "react";

import {
  TelehealthVideoFrame,
  type TelehealthVideoRoomToken,
} from "@/components/telehealth/TelehealthVideoFrame";
import { Button } from "@/components/ui/button";
import {
  ICAN_V6_DOMAIN_LABELS,
  ICAN_V6_DOMAINS,
  type IcanV6Domain,
} from "@/lib/billing/replacement-support";

const MOCK_CAPTIONS = [
  "Welcome to the Virtual Care Hub scaffold session.",
  "Captions are simulated for accessibility testing.",
  "Assessment domains can be checked in the drawer.",
  "Demo telemetry is not clinical monitoring.",
];

type Props = {
  participantId: string;
  workerId?: string;
  supportItemCode?: string;
};

export function VirtualCareHub({
  participantId,
  workerId,
  supportItemCode = "15_037_0117_1_3",
}: Props) {
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomToken, setRoomToken] = useState<TelehealthVideoRoomToken | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [domains, setDomains] = useState<IcanV6Domain[]>([]);
  const [hr, setHr] = useState(72);
  const [stress, setStress] = useState(0.28);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const startSession = async () => {
    setError(null);
    try {
      const res = await fetch("/api/telehealth/clinical-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          workerId,
          supportItemCode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not start clinical session");
        return;
      }
      if (!json.roomToken?.token) {
        setError("Session response missing room token");
        return;
      }
      setJoinUrl(json.joinUrl);
      setSessionId(json.sessionId);
      setRoomToken(json.roomToken as TelehealthVideoRoomToken);
    } catch {
      setError("Could not start clinical session");
    }
  };

  useEffect(() => {
    if (!joinUrl) return;
    const id = window.setInterval(() => {
      setCaptionIdx((i) => (i + 1) % MOCK_CAPTIONS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [joinUrl]);

  useEffect(() => {
    if (!joinUrl) return;
    const id = window.setInterval(() => {
      setHr((h) => Math.min(110, Math.max(60, h + (Math.random() > 0.5 ? 1 : -1))));
      setStress((s) =>
        Math.min(0.9, Math.max(0.1, s + (Math.random() - 0.5) * 0.04))
      );
    }, 2500);
    return () => window.clearInterval(id);
  }, [joinUrl]);

  const toggleDomain = (d: IcanV6Domain) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">Virtual Care Hub</h1>
          <p className="text-sm text-muted-foreground">
            Outer-metro telehealth scaffold — adapter-backed join URLs only.
          </p>
        </header>

        {!joinUrl ? (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => void startSession()}
          >
            Start clinical session
          </Button>
        ) : (
          <>
            {roomToken ? (
              <TelehealthVideoFrame
                joinUrl={joinUrl}
                roomToken={roomToken}
                e2eeEnabled
              />
            ) : (
              <p className="text-sm text-destructive" role="alert">
                Missing room token — video cannot start.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Session {sessionId} · support item {supportItemCode}
            </p>
            <div
              className="min-h-16 rounded-md border bg-muted/40 p-3 text-sm"
              aria-live="polite"
              aria-label="Automated captions (scaffold)"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Automated captions (scaffold)
              </p>
              <p>{MOCK_CAPTIONS[captionIdx]}</p>
            </div>
          </>
        )}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="default"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          {drawerOpen ? "Close" : "Open"} I-CAN v6 assessment
        </Button>

        {drawerOpen ? (
          <fieldset className="space-y-2 rounded-md border p-3">
            <legend className="px-1 text-sm font-medium">
              I-CAN v6 domains (scaffold)
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ICAN_V6_DOMAINS.map((d) => (
                <label key={d} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={domains.includes(d)}
                    onChange={() => toggleDomain(d)}
                  />
                  <span>{ICAN_V6_DOMAIN_LABELS[d]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>

      <aside className="space-y-3 rounded-lg border p-4">
        <h2 className="font-heading text-base font-semibold">IoT side panel</h2>
        <p className="text-xs text-muted-foreground">
          Demo telemetry — not clinical monitoring
        </p>
        <div aria-live="polite" className="space-y-2 text-sm">
          <p>Heart rate: {hr} bpm</p>
          <p>Stress index: {(stress * 100).toFixed(0)}%</p>
        </div>
      </aside>
    </div>
  );
}
