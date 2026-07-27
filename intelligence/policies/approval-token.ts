import { createHmac, timingSafeEqual } from "node:crypto";

import { approvalPayloadSchema, type ApprovalPayload } from "../types";

function secret() {
  const value = process.env.MAPABLE_AI_APPROVAL_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("MAPABLE_AI_APPROVAL_SECRET_NOT_CONFIGURED");
  return value;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signature(encodedPayload: string) {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createApprovalToken(payload: ApprovalPayload) {
  const parsed = approvalPayloadSchema.parse(payload);
  const body = encode(JSON.stringify(parsed));
  return `${body}.${signature(body)}`;
}

export function verifyApprovalToken(token: string): ApprovalPayload {
  const [body, supplied] = token.split(".");
  if (!body || !supplied) throw new Error("INVALID_APPROVAL_TOKEN");

  const expected = signature(body);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    throw new Error("INVALID_APPROVAL_TOKEN");
  }

  const payload = approvalPayloadSchema.parse(
    JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  );
  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new Error("EXPIRED_APPROVAL_TOKEN");
  }
  return payload;
}
