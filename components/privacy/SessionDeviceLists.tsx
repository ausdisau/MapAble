"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SessionRow = {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

type DeviceRow = {
  id: string;
  deviceLabel: string;
  lastSeenAt: string;
  createdAt: string;
};

export function SessionDeviceLists({
  sessions,
  devices,
}: {
  sessions: SessionRow[];
  devices: DeviceRow[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  async function revokeSession(sessionId: string) {
    setLoadingId(sessionId);
    try {
      await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      window.location.reload();
    } finally {
      setLoadingId(null);
    }
  }

  async function revokeAllSessions() {
    setRevokingAll(true);
    try {
      await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      window.location.reload();
    } finally {
      setRevokingAll(false);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="active-sessions-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="active-sessions-heading" className="text-lg font-semibold">
            Active sessions
          </h2>
          {sessions.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={revokingAll}
              onClick={() => void revokeAllSessions()}
            >
              {revokingAll ? "Signing out everywhere…" : "Sign out all sessions"}
            </Button>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Devices and browsers where you are currently signed in.
        </p>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {session.userAgent ?? "Unknown browser or device"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last active{" "}
                    {new Date(session.lastSeenAt).toLocaleString("en-AU")}
                    {" · "}
                    Expires{" "}
                    {new Date(session.expiresAt).toLocaleString("en-AU")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingId === session.id}
                  onClick={() => void revokeSession(session.id)}
                >
                  {loadingId === session.id ? "Revoking…" : "Sign out"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="trusted-devices-heading">
        <h2 id="trusted-devices-heading" className="text-lg font-semibold">
          Trusted devices
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Devices you have marked as trusted for faster sign-in.
        </p>
        {devices.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No trusted devices registered.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {devices.map((device) => (
              <li key={device.id} className="p-4">
                <p className="font-medium">{device.deviceLabel}</p>
                <p className="text-xs text-muted-foreground">
                  Last seen{" "}
                  {new Date(device.lastSeenAt).toLocaleString("en-AU")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
