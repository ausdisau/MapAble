import { randomUUID } from "crypto";

import { chainEventHash, hashPayload } from "@/lib/ledger/hash";
import type { LedgerEvent, LedgerEventType, LedgerSubjectType } from "@/lib/ledger/types";

/** In-memory chain for mock/demo — replace with persistent store in production. */
const eventChain: LedgerEvent[] = [];

export type CreateLedgerEventInput = {
  type: LedgerEventType;
  subjectType: LedgerSubjectType;
  subjectRef: string;
  participantRef: string;
  actorRole: LedgerEvent["actorRole"];
  /** Must not contain PII — references and status flags only. */
  payload: Record<string, unknown>;
};

export function createLedgerEvent(
  input: CreateLedgerEventInput
): LedgerEvent {
  const payloadHash = hashPayload(input.payload);
  const previousEventHash =
    eventChain.length > 0
      ? eventChain[eventChain.length - 1].eventHash
      : null;
  const createdAt = new Date().toISOString();
  const eventHash = chainEventHash(previousEventHash, payloadHash, {
    type: input.type,
    subjectRef: input.subjectRef,
    createdAt,
  });

  const event: LedgerEvent = {
    id: randomUUID(),
    type: input.type,
    subjectType: input.subjectType,
    subjectRef: input.subjectRef,
    participantRef: input.participantRef,
    actorRole: input.actorRole,
    payloadHash,
    previousEventHash,
    eventHash,
    createdAt,
    attestationStatus: "none",
  };

  eventChain.push(event);
  return event;
}

export function listLedgerEvents(participantRef?: string): LedgerEvent[] {
  if (!participantRef) return [...eventChain];
  return eventChain.filter((e) => e.participantRef === participantRef);
}

export function resetLedgerChainForTests(): void {
  eventChain.length = 0;
}
