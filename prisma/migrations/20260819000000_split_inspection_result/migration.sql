-- Split InspectionResult into one enum per subject.
--
-- The shared enum carried two vocabularies for the same meanings — PASS and PASSED, FAIL
-- and FAILED, NEEDS_REPAIR and ATTENTION_REQUIRED — so every comparison against it was a
-- guess about which half a value came from. equipment/route.ts branched on 'FAIL' only,
-- which meant a 'FAILED' value skipped the needs-repair path and the item was treated as
-- sound.
--
-- Note on method: `prisma migrate diff` proposes DROP COLUMN then ADD COLUMN here, which
-- would discard every recorded inspection result. This migration converts in place with an
-- explicit mapping so no data is lost.

-- CreateEnum
CREATE TYPE "EquipmentInspectionResult" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NEEDS_REPAIR');

-- CreateEnum
CREATE TYPE "WorkOrderInspectionResult" AS ENUM ('PASSED', 'FAILED', 'ATTENTION_REQUIRED');

-- Equipment: fold the work-order spellings onto the equipment ones.
--   PASSED             -> PASS
--   FAILED             -> FAIL
--   ATTENTION_REQUIRED -> NEEDS_REPAIR
ALTER TABLE "Equipment" ALTER COLUMN "inspectionResult" DROP DEFAULT;

ALTER TABLE "Equipment"
  ALTER COLUMN "inspectionResult" TYPE "EquipmentInspectionResult"
  USING (
    CASE "inspectionResult"::text
      WHEN 'PASS'               THEN 'PASS'
      WHEN 'PASSED'             THEN 'PASS'
      WHEN 'FAIL'               THEN 'FAIL'
      WHEN 'FAILED'             THEN 'FAIL'
      WHEN 'NEEDS_REPAIR'       THEN 'NEEDS_REPAIR'
      WHEN 'ATTENTION_REQUIRED' THEN 'NEEDS_REPAIR'
      ELSE 'PENDING'
    END
  )::"EquipmentInspectionResult";

ALTER TABLE "Equipment" ALTER COLUMN "inspectionResult" SET DEFAULT 'PENDING';

-- ChecklistItem: fold the equipment spellings onto the work-order ones. A work order has
-- no PENDING state — the column is simply null until an inspection is recorded.
--   PASS         -> PASSED
--   FAIL         -> FAILED
--   NEEDS_REPAIR -> ATTENTION_REQUIRED
--   PENDING      -> NULL
ALTER TABLE "ChecklistItem"
  ALTER COLUMN "inspectionResult" TYPE "WorkOrderInspectionResult"
  USING (
    CASE "inspectionResult"::text
      WHEN 'PASSED'             THEN 'PASSED'
      WHEN 'PASS'               THEN 'PASSED'
      WHEN 'FAILED'             THEN 'FAILED'
      WHEN 'FAIL'               THEN 'FAILED'
      WHEN 'ATTENTION_REQUIRED' THEN 'ATTENTION_REQUIRED'
      WHEN 'NEEDS_REPAIR'       THEN 'ATTENTION_REQUIRED'
      ELSE NULL
    END
  )::"WorkOrderInspectionResult";

-- DropEnum
DROP TYPE "InspectionResult";
