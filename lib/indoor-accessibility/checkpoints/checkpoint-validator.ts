import { createHmac, timingSafeEqual } from "crypto";

const CHECKPOINT_SECRET =
  process.env.INDOOR_CHECKPOINT_SECRET ?? "dev-checkpoint-secret-change-in-production";

export type CheckpointPayload = {
  checkpointId: string;
  venueId: string;
  floorPlanId: string;
  tokenVersion: number;
  exp: number;
};

export function signCheckpointToken(payload: Omit<CheckpointPayload, "exp"> & { exp?: number }): string {
  const full: CheckpointPayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = createHmac("sha256", CHECKPOINT_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyCheckpointToken(token: string): CheckpointPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac("sha256", CHECKPOINT_SECRET).update(data).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as CheckpointPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
