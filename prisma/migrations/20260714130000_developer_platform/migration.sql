-- CareOS Phase 12 — Developer Platform & Partner Ecosystem

CREATE TYPE "ApiClientStatus" AS ENUM ('draft', 'pending_review', 'active', 'suspended', 'revoked');
CREATE TYPE "ApiClientEnvironment" AS ENUM ('sandbox', 'production');
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'delivered', 'failed', 'dead_letter');

CREATE TABLE "api_clients" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT,
  "developerAppId" TEXT,
  "partnerSandboxAppId" TEXT,
  "name" TEXT NOT NULL,
  "status" "ApiClientStatus" NOT NULL DEFAULT 'draft',
  "environment" "ApiClientEnvironment" NOT NULL DEFAULT 'sandbox',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "api_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "scopes" "ApiScope"[],
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauth_clients" (
  "id" TEXT NOT NULL,
  "apiClientId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "clientSecretHash" TEXT NOT NULL,
  "clientSecretPrefix" TEXT NOT NULL,
  "redirectUris" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "grantTypes" TEXT[] DEFAULT ARRAY['authorization_code', 'refresh_token']::TEXT[],
  "scopes" "ApiScope"[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauth_grants" (
  "id" TEXT NOT NULL,
  "oauthClientId" TEXT NOT NULL,
  "participantId" TEXT,
  "userId" TEXT,
  "scopes" "ApiScope"[],
  "accessTokenHash" TEXT,
  "refreshTokenHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oauth_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_accounts" (
  "id" TEXT NOT NULL,
  "apiClientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scopes" "ApiScope"[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "participantAuthorityBlocked" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_access_logs" (
  "id" TEXT NOT NULL,
  "apiClientId" TEXT NOT NULL,
  "apiKeyId" TEXT,
  "serviceAccountId" TEXT,
  "path" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "statusCode" INT NOT NULL,
  "durationMs" INT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "participantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_subscriptions" (
  "id" TEXT NOT NULL,
  "apiClientId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "eventTypes" TEXT[],
  "secretHash" TEXT NOT NULL,
  "secretPrefix" TEXT NOT NULL,
  "signingVersion" INT NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "previousSecretHash" TEXT,
  "previousSecretExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_delivery_logs" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "timestampSent" TIMESTAMP(3) NOT NULL,
  "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'pending',
  "attemptCount" INT NOT NULL DEFAULT 0,
  "maxAttempts" INT NOT NULL DEFAULT 5,
  "nextRetryAt" TIMESTAMP(3),
  "lastError" TEXT,
  "responseStatus" INT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_clients_clientId_key" ON "oauth_clients"("clientId");
CREATE UNIQUE INDEX "webhook_delivery_logs_eventId_key" ON "webhook_delivery_logs"("eventId");

CREATE INDEX "api_clients_organisationId_idx" ON "api_clients"("organisationId");
CREATE INDEX "api_clients_status_idx" ON "api_clients"("status");
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_clientId_idx" ON "api_keys"("clientId");
CREATE INDEX "oauth_clients_apiClientId_idx" ON "oauth_clients"("apiClientId");
CREATE INDEX "oauth_grants_oauthClientId_idx" ON "oauth_grants"("oauthClientId");
CREATE INDEX "oauth_grants_participantId_idx" ON "oauth_grants"("participantId");
CREATE INDEX "service_accounts_apiClientId_idx" ON "service_accounts"("apiClientId");
CREATE INDEX "api_access_logs_apiClientId_createdAt_idx" ON "api_access_logs"("apiClientId", "createdAt");
CREATE INDEX "webhook_subscriptions_apiClientId_idx" ON "webhook_subscriptions"("apiClientId");
CREATE INDEX "webhook_delivery_logs_subscriptionId_createdAt_idx" ON "webhook_delivery_logs"("subscriptionId", "createdAt");
CREATE INDEX "webhook_delivery_logs_status_nextRetryAt_idx" ON "webhook_delivery_logs"("status", "nextRetryAt");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "api_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "api_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_grants" ADD CONSTRAINT "oauth_grants_oauthClientId_fkey" FOREIGN KEY ("oauthClientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "api_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "api_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "service_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "api_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
