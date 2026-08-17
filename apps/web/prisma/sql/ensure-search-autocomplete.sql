-- MapAble search autocomplete tables + pg_trgm (when extension available).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "provider_profiles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT,
  "legacyProviderId" TEXT,
  "suburb" TEXT,
  "state" TEXT,
  "postcode" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isSearchVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_profiles_slug_key" ON "provider_profiles"("slug");
CREATE INDEX IF NOT EXISTS "provider_profiles_name_idx" ON "provider_profiles"("name");
CREATE INDEX IF NOT EXISTS "provider_profiles_visible_idx" ON "provider_profiles"("isSearchVisible", "isVerified");

CREATE TABLE IF NOT EXISTS "service_categories" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_slug_key" ON "service_categories"("slug");
CREATE INDEX IF NOT EXISTS "service_categories_name_idx" ON "service_categories"("name");

CREATE TABLE IF NOT EXISTS "provider_services" (
  "id" TEXT NOT NULL,
  "providerProfileId" TEXT NOT NULL,
  "serviceCategoryId" TEXT,
  "name" TEXT NOT NULL,
  CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "accessibility_features" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accessibility_features_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accessibility_features_slug_key" ON "accessibility_features"("slug");

CREATE TABLE IF NOT EXISTS "searchable_locations" (
  "id" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "suburb" TEXT,
  "state" TEXT,
  "postcode" TEXT,
  "country" TEXT NOT NULL DEFAULT 'AU',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "searchable_locations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "searchable_locations_display_idx" ON "searchable_locations"("displayName");

CREATE TABLE IF NOT EXISTS "popular_searches" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "context" TEXT NOT NULL DEFAULT 'all',
  "weight" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "popular_searches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "popular_searches_query_context_key" ON "popular_searches"("query", "context");

CREATE TABLE IF NOT EXISTS "search_languages" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "search_languages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "search_languages_slug_key" ON "search_languages"("slug");

-- Trigram indexes (no-op if extension missing on host)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS provider_profiles_name_trgm ON "provider_profiles" USING gin ("name" gin_trgm_ops);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
