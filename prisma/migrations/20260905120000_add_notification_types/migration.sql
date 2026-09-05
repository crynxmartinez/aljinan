-- AlterEnum
--
-- Adds the NotificationType values needed to close notification gaps found across the app:
-- requests that have been quoted, quotation send/approve/reject, appointment lifecycle
-- events, and branch-request create/approve/reject. Each ADD VALUE runs as its own
-- statement (required by Postgres — an enum value cannot be used in the same transaction
-- that adds it), matching how this migration will actually be applied statement-by-statement.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REQUEST_QUOTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'QUOTATION_SENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'QUOTATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'QUOTATION_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BRANCH_REQUEST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BRANCH_REQUEST_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BRANCH_REQUEST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATE_EXPIRING';
