-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "clientSignedByEmail" TEXT,
ADD COLUMN     "clientSignedByName" TEXT,
ADD COLUMN     "supervisorSignedByEmail" TEXT,
ADD COLUMN     "supervisorSignedByName" TEXT,
ADD COLUMN     "technicianSignedByEmail" TEXT,
ADD COLUMN     "technicianSignedByName" TEXT;


-- ---------------------------------------------------------------------------
-- Reference integrity
--
-- 43 columns named like foreign keys had no constraint, including every signature and
-- authorship column. Deleting a user silently orphaned the record of who signed a safety
-- certificate, and a notification addressed to a non-existent id inserted happily and was
-- never seen — which is exactly the bug that was found in the start-now route.
--
-- These are declared in SQL rather than as Prisma relations. Modelling 31 back-relations
-- on User would be a large, error-prone schema change for no additional enforcement: the
-- database is what actually holds the line. The tradeoff is that Prisma does not know
-- about them, so the null-on-delete behaviour is applied by Postgres, not the client.
--
-- Deliberately NOT constrained, because they are polymorphic by design:
--   AuditLog.userId / resourceId  (immutable history; userEmail is already snapshotted)
--   Notification.relatedId        (points at whichever entity the notification concerns)
--   Upload.entityId               (same)
-- ---------------------------------------------------------------------------

-- nullable references to User: keep the record, drop the attribution
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_cancelledById_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_confirmedById_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BranchRequest" DROP CONSTRAINT IF EXISTS "BranchRequest_approvedById_fkey";
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BranchRequest" DROP CONSTRAINT IF EXISTS "BranchRequest_rejectedById_fkey";
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_issuedById_fkey";
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Checklist" DROP CONSTRAINT IF EXISTS "Checklist_completedById_fkey";
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_assignedTo_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_clientSignedById_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_clientSignedById_fkey" FOREIGN KEY ("clientSignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_deletedBy_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_paymentSubmittedById_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_paymentSubmittedById_fkey" FOREIGN KEY ("paymentSubmittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_paymentVerifiedById_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_paymentVerifiedById_fkey" FOREIGN KEY ("paymentVerifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_supervisorSignedById_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_supervisorSignedById_fkey" FOREIGN KEY ("supervisorSignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_technicianSignedById_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_technicianSignedById_fkey" FOREIGN KEY ("technicianSignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactInquiry" DROP CONSTRAINT IF EXISTS "ContactInquiry_convertedToId_fkey";
ALTER TABLE "ContactInquiry" ADD CONSTRAINT "ContactInquiry_convertedToId_fkey" FOREIGN KEY ("convertedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_endSignedById_fkey";
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_endSignedById_fkey" FOREIGN KEY ("endSignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_startSignedById_fkey";
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_startSignedById_fkey" FOREIGN KEY ("startSignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_paymentSubmittedById_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentSubmittedById_fkey" FOREIGN KEY ("paymentSubmittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS "Quotation_approvedById_fkey";
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS "Quotation_rejectedById_fkey";
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_acceptedById_fkey";
ALTER TABLE "Request" ADD CONSTRAINT "Request_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_assignedTo_fkey";
ALTER TABLE "Request" ADD CONSTRAINT "Request_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_quotedById_fkey";
ALTER TABLE "Request" ADD CONSTRAINT "Request_quotedById_fkey" FOREIGN KEY ("quotedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_rejectedById_fkey";
ALTER TABLE "Request" ADD CONSTRAINT "Request_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Required references to User: refuse to leave a dangling author.
--
-- NO ACTION rather than RESTRICT, deliberately. Postgres checks RESTRICT immediately,
-- so it fires even when the same cascading delete is about to remove the referencing row
-- — which made deleting a client impossible, because the client authored requests that
-- would have cascaded away with their branch anyway. NO ACTION defers the check to the
-- end of the statement: a cascade that tidies up after itself passes, while a genuine
-- dangling reference still errors.
--
-- DEFERRABLE INITIALLY DEFERRED is required as well. A non-deferrable NO ACTION is still
-- evaluated while the statement runs, before the User -> Client -> Branch -> Request
-- cascade has removed the referencing rows, so it rejects the delete just as RESTRICT did.
-- Deferring to commit lets the cascade complete first. Verified both ways.
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_createdById_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "BranchRequest" DROP CONSTRAINT IF EXISTS "BranchRequest_createdById_fkey";
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "Checklist" DROP CONSTRAINT IF EXISTS "Checklist_createdById_fkey";
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "Contract" DROP CONSTRAINT IF EXISTS "Contract_createdById_fkey";
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "ImpersonationGrant" DROP CONSTRAINT IF EXISTS "ImpersonationGrant_adminUserId_fkey";
ALTER TABLE "ImpersonationGrant" ADD CONSTRAINT "ImpersonationGrant_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_createdById_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS "Quotation_createdById_fkey";
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_createdById_fkey";
ALTER TABLE "Request" ADD CONSTRAINT "Request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- references to other tables
ALTER TABLE "Activity" DROP CONSTRAINT IF EXISTS "Activity_contractId_fkey";
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_equipmentId_fkey";
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_linkedRequestId_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_linkedRequestId_fkey" FOREIGN KEY ("linkedRequestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" DROP CONSTRAINT IF EXISTS "ChecklistItem_parentItemId_fkey";
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Equipment" DROP CONSTRAINT IF EXISTS "Equipment_workOrderId_fkey";
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_quotationId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS "Quotation_requestId_fkey";
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_workOrderId_fkey";
ALTER TABLE "Request" ADD CONSTRAINT "Request_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Upload" DROP CONSTRAINT IF EXISTS "Upload_branchId_fkey";
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- a user takes their notifications with them
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- indexes on the referencing columns, which Postgres does not create
CREATE INDEX IF NOT EXISTS "Appointment_cancelledById_idx" ON "Appointment"("cancelledById");
CREATE INDEX IF NOT EXISTS "Appointment_confirmedById_idx" ON "Appointment"("confirmedById");
CREATE INDEX IF NOT EXISTS "BranchRequest_approvedById_idx" ON "BranchRequest"("approvedById");
CREATE INDEX IF NOT EXISTS "BranchRequest_rejectedById_idx" ON "BranchRequest"("rejectedById");
CREATE INDEX IF NOT EXISTS "Certificate_issuedById_idx" ON "Certificate"("issuedById");
CREATE INDEX IF NOT EXISTS "Checklist_completedById_idx" ON "Checklist"("completedById");
CREATE INDEX IF NOT EXISTS "ChecklistItem_assignedTo_idx" ON "ChecklistItem"("assignedTo");
CREATE INDEX IF NOT EXISTS "ChecklistItem_clientSignedById_idx" ON "ChecklistItem"("clientSignedById");
CREATE INDEX IF NOT EXISTS "ChecklistItem_deletedBy_idx" ON "ChecklistItem"("deletedBy");
CREATE INDEX IF NOT EXISTS "ChecklistItem_paymentSubmittedById_idx" ON "ChecklistItem"("paymentSubmittedById");
CREATE INDEX IF NOT EXISTS "ChecklistItem_paymentVerifiedById_idx" ON "ChecklistItem"("paymentVerifiedById");
CREATE INDEX IF NOT EXISTS "ChecklistItem_supervisorSignedById_idx" ON "ChecklistItem"("supervisorSignedById");
CREATE INDEX IF NOT EXISTS "ChecklistItem_technicianSignedById_idx" ON "ChecklistItem"("technicianSignedById");
CREATE INDEX IF NOT EXISTS "ContactInquiry_convertedToId_idx" ON "ContactInquiry"("convertedToId");
CREATE INDEX IF NOT EXISTS "Contract_endSignedById_idx" ON "Contract"("endSignedById");
CREATE INDEX IF NOT EXISTS "Contract_startSignedById_idx" ON "Contract"("startSignedById");
CREATE INDEX IF NOT EXISTS "Invoice_paymentSubmittedById_idx" ON "Invoice"("paymentSubmittedById");
CREATE INDEX IF NOT EXISTS "Quotation_approvedById_idx" ON "Quotation"("approvedById");
CREATE INDEX IF NOT EXISTS "Quotation_rejectedById_idx" ON "Quotation"("rejectedById");
CREATE INDEX IF NOT EXISTS "Request_acceptedById_idx" ON "Request"("acceptedById");
CREATE INDEX IF NOT EXISTS "Request_assignedTo_idx" ON "Request"("assignedTo");
CREATE INDEX IF NOT EXISTS "Request_quotedById_idx" ON "Request"("quotedById");
CREATE INDEX IF NOT EXISTS "Request_rejectedById_idx" ON "Request"("rejectedById");
CREATE INDEX IF NOT EXISTS "Appointment_createdById_idx" ON "Appointment"("createdById");
CREATE INDEX IF NOT EXISTS "BranchRequest_createdById_idx" ON "BranchRequest"("createdById");
CREATE INDEX IF NOT EXISTS "Checklist_createdById_idx" ON "Checklist"("createdById");
CREATE INDEX IF NOT EXISTS "Contract_createdById_idx" ON "Contract"("createdById");
CREATE INDEX IF NOT EXISTS "ImpersonationGrant_adminUserId_idx" ON "ImpersonationGrant"("adminUserId");
CREATE INDEX IF NOT EXISTS "Invoice_createdById_idx" ON "Invoice"("createdById");
CREATE INDEX IF NOT EXISTS "Quotation_createdById_idx" ON "Quotation"("createdById");
CREATE INDEX IF NOT EXISTS "Request_createdById_idx" ON "Request"("createdById");
CREATE INDEX IF NOT EXISTS "Activity_contractId_idx" ON "Activity"("contractId");
CREATE INDEX IF NOT EXISTS "Certificate_equipmentId_idx" ON "Certificate"("equipmentId");
CREATE INDEX IF NOT EXISTS "ChecklistItem_linkedRequestId_idx" ON "ChecklistItem"("linkedRequestId");
CREATE INDEX IF NOT EXISTS "ChecklistItem_parentItemId_idx" ON "ChecklistItem"("parentItemId");
CREATE INDEX IF NOT EXISTS "Equipment_workOrderId_idx" ON "Equipment"("workOrderId");
CREATE INDEX IF NOT EXISTS "Invoice_quotationId_idx" ON "Invoice"("quotationId");
CREATE INDEX IF NOT EXISTS "Quotation_requestId_idx" ON "Quotation"("requestId");
CREATE INDEX IF NOT EXISTS "Request_workOrderId_idx" ON "Request"("workOrderId");
CREATE INDEX IF NOT EXISTS "Upload_branchId_idx" ON "Upload"("branchId");

-- RequestComment.createdById had no explicit rule, so Prisma defaulted it to RESTRICT.
-- That meant any client who had ever left a comment could not be deleted at all. A comment
-- belongs to its author and should go with them.
ALTER TABLE "RequestComment" DROP CONSTRAINT IF EXISTS "RequestComment_createdById_fkey";
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
