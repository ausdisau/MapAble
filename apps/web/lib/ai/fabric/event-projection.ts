/**
 * Projection boundary for the MapAble AI Fabric.
 *
 * This module deliberately does not depend on KafkaJS or open network sockets.
 * A separately deployed worker can supply an implementation after verifying
 * tenant scoping, Australian data residency, delivery guarantees and consent.
 *
 * Never publish events from a model tool call directly: a trusted deterministic
 * service owns approval, consent and the transactional outbox.
 */
import {
  aiFabricEventSchema,
  topicForFabricEvent,
  type AiFabricEvent,
  type AiFabricTopic
} from "./contracts";
import { getFabricModule } from "./manifest";

export type FabricEventProducer = {
  send(input: {
    topic: AiFabricTopic;
    messages: Array<{ key: string; value: string; headers: Record<string, string> }>;
  }): Promise<unknown>;
};

export type FabricPublishResult =
  | { status: "disabled"; reason: string }
  | { status: "published"; eventId: string; topic: AiFabricTopic };

export function fabricStreamingEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return (
    env.MAPABLE_AI_FABRIC_KAFKA_ENABLED === "true" &&
    env.MAPABLE_AI_FABRIC_MODE === "shadow" &&
    env.MAPABLE_AI_FABRIC_HUMAN_REVIEW_ONLY === "true"
  );
}

/**
 * Only server-created, already-authorised metadata events enter the stream.
 * Delivery via this adapter is *not* transactional. Production integrations
 * must use the database outbox and relay with idempotent consumers.
 */
export async function publishFabricProjection(
  candidate: unknown,
  producer: FabricEventProducer,
  env: Readonly<Record<string, string | undefined>> = process.env
): Promise<FabricPublishResult> {
  if (!fabricStreamingEnabled(env)) {
    return { status: "disabled", reason: "fabric_streaming_disabled" };
  }

  const event: AiFabricEvent = aiFabricEventSchema.parse(candidate);
  const module = getFabricModule(event.moduleId);
  if (!module || module.state !== "in_main" || module.integration !== "already_present") {
    return { status: "disabled", reason: "module_unapproved_or_unavailable" };
  }

  const topic = topicForFabricEvent(event);
  await producer.send({
    topic,
    messages: [
      {
        key: event.aggregateDigest,
        value: JSON.stringify(event),
        headers: {
          "schema-version": "1",
          "event-id": event.eventId,
          "event-kind": event.kind
        }
      }
    ]
  });
  return { status: "published", eventId: event.eventId, topic };
}

/**
 * Consumer quarantine defaults. A revoked consent should invalidate any cached
 * read model; Kafka record deletion is not a privacy erasure mechanism.
 */
export function shouldQuarantineFabricEvent(
  event: AiFabricEvent,
  knownWithdrawalDigests: ReadonlySet<string>
): boolean {
  return (
    event.kind !== "consent.withdrawal_observed" &&
    knownWithdrawalDigests.has(event.aggregateDigest)
  );
}
