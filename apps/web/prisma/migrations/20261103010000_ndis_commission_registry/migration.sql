CREATE TABLE "ndis_commission_register_imports" (
"id" UUID NOT NULL,"source_hash" TEXT NOT NULL,"source_url" TEXT NOT NULL,
"row_count" INTEGER NOT NULL,"record_count" INTEGER NOT NULL,"imported_by" TEXT NOT NULL,
"status" TEXT NOT NULL,"created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "ndis_commission_register_imports_pkey" PRIMARY KEY("id"));
CREATE TABLE "ndis_commission_registrations" (
"import_id" UUID NOT NULL,"registration_id" TEXT NOT NULL,"legal_name" TEXT NOT NULL,
"business_name" TEXT,"abn" TEXT,"registration_status" TEXT NOT NULL,"registration_end" TEXT,
"registration_groups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],"row_hash" TEXT NOT NULL,
CONSTRAINT "ndis_commission_registrations_pkey" PRIMARY KEY("import_id","registration_id"));
CREATE TABLE "ndis_commission_publications" (
"code" TEXT NOT NULL,"import_id" UUID NOT NULL,"published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"published_by" TEXT NOT NULL,
CONSTRAINT "ndis_commission_publications_pkey" PRIMARY KEY("code"));
CREATE INDEX "ndis_commission_register_imports_status_created_at_idx" ON "ndis_commission_register_imports"("status","created_at");
CREATE INDEX "ndis_commission_registrations_import_id_abn_idx" ON "ndis_commission_registrations"("import_id","abn");
CREATE INDEX "ndis_commission_registrations_import_id_registration_status_idx" ON "ndis_commission_registrations"("import_id","registration_status");
ALTER TABLE "ndis_commission_registrations" ADD CONSTRAINT "ndis_commission_registrations_import_id_fkey"
FOREIGN KEY("import_id") REFERENCES "ndis_commission_register_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ndis_commission_publications" ADD CONSTRAINT "ndis_commission_publications_import_id_fkey"
FOREIGN KEY("import_id") REFERENCES "ndis_commission_register_imports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
