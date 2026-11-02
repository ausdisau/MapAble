/**
 * Read-only tool vocabulary inspired by Agentic's curated API/MCP gateway.
 * NO Agentic source, MCP server, network credentials or tool transport is imported.
 * This is a demonstration policy gate, never production authorisation.
 */
export type AgentTool =
  | "public_marketplace_catalogue.search"
  | "public_provider_evidence.read"
  | "marketplace.enquiry.prepare"
  | "provider.inquiry.send"
  | "worker.clearance.read"
  | "saleor.checkout.create"
  | "saleor.order.create"
  | "stripe.payment.capture"
  | "ndis.eligibility.decide"
  | "participant.private_record.read";

export interface ToolDescriptor {
  readonly name: AgentTool;
  readonly requiresParticipantChoice: boolean;
  readonly consequence: "public_read" | "prepare_only" | "restricted";
}
export const CURATED_AGENT_TOOLS: readonly ToolDescriptor[] = [
  { name: "public_marketplace_catalogue.search", requiresParticipantChoice: false, consequence: "public_read" },
  { name: "public_provider_evidence.read", requiresParticipantChoice: false, consequence: "public_read" },
  { name: "marketplace.enquiry.prepare", requiresParticipantChoice: true, consequence: "prepare_only" },
  { name: "provider.inquiry.send", requiresParticipantChoice: true, consequence: "restricted" },
  { name: "worker.clearance.read", requiresParticipantChoice: true, consequence: "restricted" },
  { name: "saleor.checkout.create", requiresParticipantChoice: true, consequence: "restricted" },
  { name: "saleor.order.create", requiresParticipantChoice: true, consequence: "restricted" },
  { name: "stripe.payment.capture", requiresParticipantChoice: true, consequence: "restricted" },
  { name: "ndis.eligibility.decide", requiresParticipantChoice: true, consequence: "restricted" },
  { name: "participant.private_record.read", requiresParticipantChoice: true, consequence: "restricted" },
];

export function reviewAgentTool(args: {
  tool: string;
  participantChoseAction: boolean;
  requestedData: "public" | "synthetic" | "personal" | "health" | "worker_private";
}) {
  const descriptor = CURATED_AGENT_TOOLS.find((item) => item.name === args.tool);
  if (!descriptor) return { decision: "BLOCK" as const, reason: "Unknown tool; deny by default." };
  if (descriptor.consequence === "restricted") {
    return { decision: "BLOCK" as const, reason: "External, consequential or private tool is disabled in this sandbox." };
  }
  if (args.requestedData !== "public" && args.requestedData !== "synthetic") {
    return { decision: "BLOCK" as const, reason: "Private or sensitive records are out of scope." };
  }
  if (descriptor.requiresParticipantChoice && !args.participantChoseAction) {
    return { decision: "BLOCK" as const, reason: "The participant has not requested preparation." };
  }
  return {
    decision: descriptor.consequence === "public_read" ? "ALLOW_LOCAL_READ" as const : "ALLOW_LOCAL_DRAFT" as const,
    reason: "Permitted in-memory simulation only; no network or real consent receipt.",
  };
}
export const REMOTE_MCP_ENABLED = false as const;
export const REMOTE_A2A_ENABLED = false as const;
export const EXTERNAL_PURCHASE_ENABLED = false as const;
