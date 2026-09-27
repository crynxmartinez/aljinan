ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLocale" TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "content" JSONB;
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "generatedContent" JSONB;
ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "generatedContent" JSONB;

-- Historical defaults are recognized only by their generator marker, relations,
-- and exact original template. No title, note, signature, or customer text changes.
UPDATE "Certificate" c
SET "generatedContent" = jsonb_build_object(
  'version', 1, 'kind', 'equipmentCertificate',
  'params', jsonb_build_object('type', e."equipmentType"::text, 'number', e."equipmentNumber"),
  'original', jsonb_build_object('title', c.title, 'description', c.description, 'issuedBy', c."issuedBy")
)
FROM "Equipment" e
WHERE c."generatedContent" IS NULL AND c."equipmentId" = e.id
  AND c."issuedBy" = 'System (Auto-generated)'
  AND c.title = replace(e."equipmentType"::text, '_', ' ') || ' ' || e."equipmentNumber" || ' - Inspection Certificate'
  AND c.description = 'Sticker inspection certificate for ' || e."equipmentNumber";

UPDATE "Certificate" c
SET "generatedContent" = jsonb_build_object(
  'version', 1, 'kind', 'workOrderCertificate',
  'params', jsonb_build_object('type', c.type::text, 'work', w.description, 'defaultDescription',
    CASE WHEN c.description = 'Certificate for completed work: ' || w.description THEN 'true' ELSE 'false' END),
  'original', jsonb_build_object('title', c.title, 'description', c.description, 'issuedBy', c."issuedBy")
)
FROM "ChecklistItem" w
WHERE c."generatedContent" IS NULL AND c."workOrderId" = w.id AND c."equipmentId" IS NULL
  AND c."issuedBy" = 'System (Auto-generated)'
  AND c.title = upper(substr(c.type::text, 1, 1)) || replace(lower(substr(c.type::text, 2)), '_', ' ') || ' Certificate - ' || w.description;

UPDATE "ChecklistItem" w
SET "generatedContent" = jsonb_build_object(
  'version', 1, 'kind', 'maintenanceVisit',
  'params', jsonb_build_object('system', s.name, 'frequency', s.frequency::text, 'visit', (w."visitIndex" + 1)::text,
    'defaultNotes', CASE WHEN w.notes = 'Scheduled maintenance for ' || s.name THEN 'true' ELSE 'false' END),
  'original', jsonb_build_object('description', w.description, 'notes', w.notes)
)
FROM "ContractSystem" s
WHERE w."generatedContent" IS NULL AND w."contractSystemId" = s.id AND w."visitIndex" IS NOT NULL
  AND w.description = s.name || ' - ' || CASE s.frequency::text
    WHEN 'MONTHLY' THEN 'Monthly' WHEN 'QUARTERLY' THEN 'Quarterly'
    WHEN 'SEMI_ANNUALLY' THEN 'Semi-Annual' WHEN 'ANNUALLY' THEN 'Annual'
    ELSE s.frequency::text END || ' Visit ' || (w."visitIndex" + 1)::text;
