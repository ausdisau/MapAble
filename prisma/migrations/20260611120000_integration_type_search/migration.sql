-- Add search integration type for OpenSearch and similar backends.
-- Historical empty-DB repair: IntegrationType was introduced via db push / schema
-- without a CREATE TYPE migration. Create the pre-search enum, then add 'search'.

DO $$ BEGIN
    CREATE TYPE "IntegrationType" AS ENUM (
        'identity',
        'database',
        'realtime',
        'maps',
        'workflow',
        'automation',
        'cms',
        'analytics',
        'clinical_fhir',
        'telehealth',
        'scheduling',
        'finance'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "IntegrationType" ADD VALUE IF NOT EXISTS 'search';
