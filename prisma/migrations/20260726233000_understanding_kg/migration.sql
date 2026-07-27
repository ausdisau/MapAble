-- Understanding layer (CSNN Sprint 2): contexts, graph edges, informal supports, living-arrangement signals.

CREATE TYPE "InformalSupportStabilityTrend" AS ENUM ('stable', 'declining', 'improving', 'unknown');
CREATE TYPE "LivingArrangementRiskLevel" AS ENUM ('low', 'moderate', 'high');

CREATE TABLE "understanding_contexts" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "understanding_contexts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "understanding_graph_edges" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "understanding_graph_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "informal_support_links" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "supporterDisplayName" TEXT NOT NULL,
    "supporterUserId" TEXT,
    "relationshipLabel" TEXT NOT NULL,
    "capacityScore" INTEGER NOT NULL DEFAULT 50,
    "stabilityTrend" "InformalSupportStabilityTrend" NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "informal_support_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "living_arrangement_signals" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "riskLevel" "LivingArrangementRiskLevel" NOT NULL DEFAULT 'low',
    "score" INTEGER NOT NULL DEFAULT 0,
    "reasonsJson" JSONB NOT NULL DEFAULT '[]',
    "informationalOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "living_arrangement_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "understanding_contexts_participantId_key_key" ON "understanding_contexts"("participantId", "key");
CREATE INDEX "understanding_contexts_participantId_idx" ON "understanding_contexts"("participantId");

CREATE UNIQUE INDEX "understanding_graph_edges_participantId_sourceType_sourceId_targetType_targetId_relationship_key"
  ON "understanding_graph_edges"("participantId", "sourceType", "sourceId", "targetType", "targetId", "relationship");
CREATE INDEX "understanding_graph_edges_participantId_relationship_idx"
  ON "understanding_graph_edges"("participantId", "relationship");

CREATE INDEX "informal_support_links_participantId_stabilityTrend_idx"
  ON "informal_support_links"("participantId", "stabilityTrend");

CREATE UNIQUE INDEX "living_arrangement_signals_participantId_key" ON "living_arrangement_signals"("participantId");

ALTER TABLE "understanding_contexts" ADD CONSTRAINT "understanding_contexts_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "understanding_graph_edges" ADD CONSTRAINT "understanding_graph_edges_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "informal_support_links" ADD CONSTRAINT "informal_support_links_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "informal_support_links" ADD CONSTRAINT "informal_support_links_supporterUserId_fkey"
  FOREIGN KEY ("supporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "living_arrangement_signals" ADD CONSTRAINT "living_arrangement_signals_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
