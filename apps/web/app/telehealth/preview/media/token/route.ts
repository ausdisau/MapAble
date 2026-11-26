import { randomUUID } from "node:crypto";

import { AccessToken, TrackSource } from "livekit-server-sdk";

import { readBoundedRequestBody } from "@/lib/security/read-bounded-body";
import {
  isHealthcareMediaLabRequest,
  labRoomCode,
} from "@/lib/telehealth/healthcare-media-lab";

export const runtime = "nodejs";

const responseHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!isHealthcareMediaLabRequest(request.headers)) {
    return Response.json(
      { error: "Local media lab unavailable." },
      { status: 404, headers: responseHeaders },
    );
  }

  const invalidRoomCode = () =>
    Response.json(
      { error: "Invalid lab room code." },
      { status: 400, headers: responseHeaders },
    );

  if (request.headers.get("content-type") !== "application/json")
    return invalidRoomCode();
  const bounded = await readBoundedRequestBody(request, { maxBytes: 128 });
  if (!bounded.ok) return invalidRoomCode();

  let roomCode: unknown;
  try {
    roomCode = JSON.parse(new TextDecoder().decode(bounded.bytes))?.roomCode;
  } catch {
    return invalidRoomCode();
  }
  if (typeof roomCode !== "string" || !labRoomCode.test(roomCode))
    return invalidRoomCode();

  // These are LiveKit's published local development credentials.
  const token = new AccessToken("devkey", "secret", {
    identity: randomUUID(),
    ttl: "5m",
  });
  token.addGrant({
    room: `mapable-practice-${roomCode}`,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
  });

  return Response.json(
    { url: "ws://127.0.0.1:7880", token: await token.toJwt() },
    { headers: responseHeaders },
  );
}
