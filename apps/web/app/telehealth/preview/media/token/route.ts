import { randomUUID } from "node:crypto";

import { AccessToken, TrackSource } from "livekit-server-sdk";

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

  // Read at most the small, fixed payload this local endpoint accepts.
  const stream = request.body?.getReader();
  const tooLarge = () =>
    Response.json(
      { error: "Invalid lab room code." },
      { status: 400, headers: responseHeaders },
    );
  if (!stream || request.headers.get("content-type") !== "application/json")
    return tooLarge();

  let payload = "";
  const decoder = new TextDecoder();
  try {
    let length = 0;
    for (;;) {
      const { done, value } = await stream.read();
      if (done) break;
      length += value.byteLength;
      if (length > 128) {
        await stream.cancel();
        return tooLarge();
      }
      payload += decoder.decode(value, { stream: true });
    }
    payload += decoder.decode();
  } catch {
    return tooLarge();
  }

  let roomCode: unknown;
  try {
    roomCode = JSON.parse(payload)?.roomCode;
  } catch {
    return tooLarge();
  }
  if (typeof roomCode !== "string" || !labRoomCode.test(roomCode))
    return tooLarge();

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
