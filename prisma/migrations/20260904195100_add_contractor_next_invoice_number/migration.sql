-- AlterTable
--
-- `nextInvoiceNumber` was added to the Contractor model in schema.prisma and is live in
-- src/app/api/branches/[branchId]/invoices/route.ts (it drives the INV-00001-style counter),
-- but no migration was ever generated for it -- a from-scratch database (e.g. CI, or a fresh
-- restore) is missing this column even though schema.prisma and the generated Prisma Client
-- both assume it exists. IF NOT EXISTS makes this safe to apply even if a environment (such
-- as production, if the column was added there directly via `prisma db push` at some point
-- outside migration history) already has it.
ALTER TABLE "Contractor" ADD COLUMN IF NOT EXISTS "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1;
