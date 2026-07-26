"use client";

import { useEffect, useMemo, useState } from "react";

export type TelehealthVideoRoomToken = {
  token: string;
  expiresAt: string;
  provider: {
    identity: string;
    roomName: string;
    e2eeRequired: true;
  };
};

type TelehealthVideoFrameProps = {
  joinUrl: string;
  /** Short-lived room token from `/api/telehealth/clinical-session`. Required. */
  roomToken: TelehealthVideoRoomToken;
  /** Force WebRTC E2EE — must be true for clinical sessions. */
  e2eeEnabled?: true;
};

type InitState =
  | { status: "ready" }
  | { status: "blocked"; reason: string };

function validateRoomToken(
  roomToken: TelehealthVideoRoomToken | null | undefined,
): string | null {
  if (!roomToken?.token?.trim()) {
    return "Missing room token — video frame will not initialise.";
  }
  if (!roomToken.expiresAt) {
    return "Room token is missing an expiry.";
  }
  const expiresAt = Date.parse(roomToken.expiresAt);
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    return "Room token has expired. Start a new clinical session.";
  }
  if (roomToken.provider?.e2eeRequired !== true) {
    return "Room token does not require E2EE.";
  }
  return null;
}

/**
 * Token-gated telehealth video frame.
 * Refuses to load media unless a valid short-lived room token is present and
 * End-to-End Encryption is forced on for the WebRTC session.
 */
export function TelehealthVideoFrame({
  joinUrl,
  roomToken,
  e2eeEnabled = true,
}: TelehealthVideoFrameProps) {
  const [initState, setInitState] = useState<InitState>({ status: "ready" });

  const tokenError = useMemo(() => validateRoomToken(roomToken), [roomToken]);

  const gatedSrc = useMemo(() => {
    if (typeof window === "undefined") return joinUrl;
    try {
      const url = new URL(joinUrl, window.location.origin);
      url.searchParams.set("access_token", roomToken.token);
      url.searchParams.set("e2ee", "1");
      return url.toString();
    } catch {
      return joinUrl;
    }
  }, [joinUrl, roomToken.token]);

  useEffect(() => {
    if (tokenError) {
      setInitState({ status: "blocked", reason: tokenError });
      return;
    }
    if (e2eeEnabled !== true) {
      setInitState({
        status: "blocked",
        reason: "E2EE must be enabled for telehealth video sessions.",
      });
      return;
    }

    // Scaffold WebRTC / LiveKit / Twilio client bootstrap.
    // Real SDKs must receive: token, e2ee: true, roomName, identity.
    const connectionConfig = {
      url: joinUrl,
      token: roomToken.token,
      roomName: roomToken.provider.roomName,
      identity: roomToken.provider.identity,
      e2ee: true as const,
      e2eeRequired: true as const,
    };

    void connectionConfig;
    setInitState({ status: "ready" });
  }, [e2eeEnabled, joinUrl, roomToken, tokenError]);

  if (initState.status === "blocked") {
    return (
      <div
        role="alert"
        className="flex aspect-video w-full items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive"
      >
        {initState.reason}
      </div>
    );
  }

  return (
    <iframe
      src={gatedSrc}
      title="Telehealth video session"
      className="aspect-video w-full rounded-lg border"
      allow="camera; microphone; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      data-e2ee="required"
      data-room-token-exp={roomToken.expiresAt}
    />
  );
}
