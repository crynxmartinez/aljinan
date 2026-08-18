-- Constraints that make concurrency bugs impossible, plus the indexes Postgres does not
-- create for you.

-- ---------------------------------------------------------------------------
-- One auto-generated certificate per work order, per item
--
-- Certificate generation guarded with `findFirst({ where: { workOrderId } })` and then
-- created. Two concurrent completions — a supervisor signing while a client signs, or a
-- double submit — both saw nothing and both created, leaving the branch with two
-- certificates for one inspection, each with its own expiry.
--
-- COALESCE is needed because a non-sticker certificate has no equipmentId, and NULLs are
-- distinct in a unique index: without it, two rows with a null equipmentId and the same
-- work order would both be permitted, which is the case being guarded.
--
-- Scoped to auto-generated certificates. A contractor may legitimately upload more than one
-- document against the same work order by hand.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_auto_per_workorder_item_key"
  ON "Certificate" ("workOrderId", COALESCE("equipmentId", ''))
  WHERE "issuedBy" = 'System (Auto-generated)' AND "workOrderId" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Work order numbers are unique per contractor
--
-- The counter increment is atomic, but nothing stopped a number being reused if a create
-- was retried, or if two paths derived a number independently.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "ChecklistItem_contractor_workOrderNumber_key"
  ON "ChecklistItem" ("workOrderNumber")
  WHERE "workOrderNumber" IS NOT NULL AND "deletedAt" IS NULL;

-- ---------------------------------------------------------------------------
-- Slugs are required
--
-- Routing resolves a client or branch by slug. A null slug produced a link to
-- /dashboard/clients/, a route that quietly falls through to the list page rather than the
-- record. Generation now always yields a value, so the column can say so.
-- ---------------------------------------------------------------------------
UPDATE "Client" SET slug = 'client-' || substr(id, 1, 8) WHERE slug IS NULL OR slug = '';
UPDATE "Branch" SET slug = 'branch-' || substr(id, 1, 8) WHERE slug IS NULL OR slug = '';

ALTER TABLE "Client" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Branch" ALTER COLUMN "slug" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Indexes on child tables
--
-- Prisma creates the foreign key but not an index on the referencing side, so every
-- "line items for this invoice" or "comments on this request" read was a sequential scan.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem" ("invoiceId");
CREATE INDEX IF NOT EXISTS "QuotationItem_quotationId_idx" ON "QuotationItem" ("quotationId");
CREATE INDEX IF NOT EXISTS "RequestComment_requestId_idx" ON "RequestComment" ("requestId");
CREATE INDEX IF NOT EXISTS "RequestPhoto_requestId_idx" ON "RequestPhoto" ("requestId");
CREATE INDEX IF NOT EXISTS "InspectionPhoto_checklistItemId_idx" ON "InspectionPhoto" ("checklistItemId");
CREATE INDEX IF NOT EXISTS "Appointment_branchId_idx" ON "Appointment" ("branchId");
CREATE INDEX IF NOT EXISTS "Appointment_date_idx" ON "Appointment" ("date");
CREATE INDEX IF NOT EXISTS "BranchRequest_clientId_idx" ON "BranchRequest" ("clientId");
CREATE INDEX IF NOT EXISTS "BranchRequest_status_idx" ON "BranchRequest" ("status");
CREATE INDEX IF NOT EXISTS "ContractPayment_contractId_idx2" ON "ContractPayment" ("contractId");
CREATE INDEX IF NOT EXISTS "Activity_branchId_idx2" ON "Activity" ("branchId");
